import { getSecret } from "@aws-lambda-powertools/parameters/secrets";

const webDomain = process.env.YTG_WEB_DOMAIN!;
const authDomain = process.env.YTG_AUTH_DOMAIN!;
const secretName = process.env.YTG_SECRET_NAME!;

const { clientId, }
    = await getSecret(secretName, { transform: 'json' }) as {
        clientId: string;
    };
const signoutEndpoint = `https://${authDomain}/logout`;
const signoutUrl = new URL(signoutEndpoint);
signoutUrl.searchParams.append('client_id', clientId);
signoutUrl.searchParams.append('logout_uri', `https://${webDomain}/`);

export default defineEventHandler(async (event) => {

    const options = {
        domain: webDomain,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict' as const,
    };
    deleteCookie(event, 'CloudFront-Key-Pair-Id', options);
    deleteCookie(event, 'CloudFront-Policy', options);
    deleteCookie(event, 'CloudFront-Signature', options);

    return sendRedirect(event, signoutUrl.toString(), 302);
})