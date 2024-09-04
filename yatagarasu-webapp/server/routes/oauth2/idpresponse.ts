import { getSecret } from '@aws-lambda-powertools/parameters/secrets';
import { DecryptCommand, KMSClient } from '@aws-sdk/client-kms';
import { CloudfrontSignedCookiesOutput, getSignedCookies } from '@aws-sdk/cloudfront-signer';


const webDomain = process.env.YTG_WEB_DOMAIN!;
const authDomain = process.env.YTG_AUTH_DOMAIN!;
const secretName = process.env.YTG_SECRET_NAME!;

const { clientSecret, clientId, callbackUrl, cryptKeyId, publicKeyId, encryptedPrivateKey }
    = await getSecret(secretName, { transform: 'json' }) as {
        clientSecret: string;
        clientId: string;
        callbackUrl: string;
        cryptKeyId: string;
        publicKeyId: string;
        encryptedPrivateKey: string;
    };
const tokenEndpoint = `https://${authDomain}/oauth2/token`;
const kmsClient = new KMSClient();

interface CognitoTokenEndpointResponse {
    id_token: string;
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
};

const fetchTokens = async (code: string, callbackUrl: string): Promise<CognitoTokenEndpointResponse> => {
    return $fetch(tokenEndpoint, {
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
    });
}

const decodePrivateKey = async (): Promise<string> => {
    return kmsClient.send(new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedPrivateKey, 'base64'),
        KeyId: cryptKeyId
    })).then(res => Buffer.from(res.Plaintext!).toString('utf-8'));
}

const buildCloudfrontSignedCookies = async (expiration: number): Promise<CloudfrontSignedCookiesOutput> => {

    const privateKey = await decodePrivateKey();
    const policy = {
        Statement: [{
            Resource: `https://${webDomain}/*`,
            Condition: {
                DateLessThan: {
                    "AWS:EpochTime": Math.floor(Date.now() / 1000) + Math.max(expiration - 60, 60),
                }
            }
        }]
    };

    return getSignedCookies({
        keyPairId: publicKeyId,
        privateKey: privateKey,
        policy: JSON.stringify(policy),
    });
}

export default defineEventHandler(async (event) => {

    const { code } = getQuery(event);
    if (!code) {
        throw createError({
            statusCode: 400,
        });
    }

    const { id_token, access_token, token_type, expires_in } = await fetchTokens(code.toString(), callbackUrl);
    const cookies = await buildCloudfrontSignedCookies(expires_in);

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