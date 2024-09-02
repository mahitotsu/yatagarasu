import { getSecret } from '@aws-lambda-powertools/parameters/secrets';

export default defineEventHandler(async (event) => {

    const { code } = getQuery(event);
    if (!code) {
        throw createError({
            statusCode: 400,
        });
    }

    const { authDomain, secretName } = useRuntimeConfig(event);
    const { clientSecret, clientId, callbackUrl } = await getSecret(secretName, { transform: 'json' }) as {
        clientSecret: string;
        clientId: string;
        callbackUrl: string;
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

    return JSON.stringify({
        authDomain, id_token, access_token, token_type, expires_in
    }, null, 4);
});