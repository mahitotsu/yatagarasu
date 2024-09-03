import { getSecret } from '@aws-lambda-powertools/parameters/secrets';
import { DecryptCommand, KMSClient } from '@aws-sdk/client-kms';
import { getSignedCookies } from '@aws-sdk/cloudfront-signer';

export default defineEventHandler(async (event) => {

    const { code } = getQuery(event);
    if (!code) {
        throw createError({
            statusCode: 400,
        });
    }

    const { authDomain, secretName, webDomain } = useRuntimeConfig(event);
    const { clientSecret, clientId, callbackUrl, cryptKeyId, publicKeyId, encryptedPrivateKey}
        = await getSecret(secretName, { transform: 'json' }) as {
            clientSecret: string;
            clientId: string;
            callbackUrl: string;
            cryptKeyId: string;
            publicKeyId: string;
            encryptedPrivateKey: string;
        };

    const tokenEndpoint = `https://${authDomain}/oauth2/token`;
    const { id_token, access_token, token_type, expires_in } = await $fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
        },
        body: [
            `grant_type=authorization_code`,
            `code=${code}`,
            `redirect_uri=${callbackUrl}`
        ].join('&'),
    }) as {
        id_token: string;
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    };

    const kmsClient = new KMSClient();
    const privateKey = await kmsClient.send(new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedPrivateKey, 'base64'),
        KeyId: cryptKeyId
    })).then(res => Buffer.from(res.Plaintext!).toString('utf-8'))

    const policy = {
        Statement: [{
            Resource: `https://${webDomain}/*`,
            Condition: {
                DateLessThan: {
                    "AWS:EpochTime": Math.floor(Date.now() / 1000) + 24 * 60 * 60, 
                }
            }
        }]
    };
    const cookies = getSignedCookies({
        keyPairId: publicKeyId,
        privateKey: privateKey,
        policy: JSON.stringify(policy),
    });
    const options = {
        domain: webDomain,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict' as const,
    };
    Object.entries(cookies).forEach(([key, value]) => {
        setCookie(event, key, value, options);
    });

    return sendRedirect(event, '/', 302);
});