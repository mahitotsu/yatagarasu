import { getSecret } from '@aws-lambda-powertools/parameters/secrets';

export default defineEventHandler(async (event) => {

    const { authDomain, secretName } = useRuntimeConfig(event);
    const { clientId, callbackUrl } = await getSecret(secretName, { transform: 'json' }) as {
        clientSecret: string;
        clientId: string;
        callbackUrl: string;
    };

    const authUrl = new URL(`https://${authDomain}/oauth2/authorize`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'email openid');
    authUrl.searchParams.append('redirect_uri', callbackUrl);

    const html = `<!DOCTYPE html>
    <html>
         <title>redirect to signin page ...</title>
         <body>
            <p>Please sign in to continue. You can access the sign-in page <a href="${authUrl.toString()}">here</a>.</p>
         </body>
    </html>
    `;

    return send(event, html, 'text/html');
})