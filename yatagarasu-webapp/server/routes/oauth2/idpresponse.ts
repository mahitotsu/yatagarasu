import { getSecret } from '@aws-lambda-powertools/parameters/secrets';

export default defineEventHandler(async (event) => {

    const { code } = getQuery(event);
    if (!code) {
        throw createError({
            statusCode: 400,
        });
    }

    const { authDomain, secretName } = useRuntimeConfig(event);
    const tokenEndpoint = `https://${authDomain}/oauth2/token`;

    const { clientSecret } = await getSecret(secretName, { transform: 'json' }) as {
        clientSecret: string;
    };

    return JSON.stringify({
        authDomain,
    }, null, 4);
});