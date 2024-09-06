import { getSecret } from "@aws-lambda-powertools/parameters/secrets";

interface SecretValues {
    userPoolId: string;
    clientSecret: string;
    clientId: string;
    callbackUrl: string;
    cryptKeyId: string;
    publicKeyId: string;
    encryptedPrivateKey: string;
    sessionPassword: string;
};

const secretName = process.env.YTG_SECRET_NAME!;
const secretValues = await getSecret(secretName, { transform: 'json' }) as SecretValues;

export const getSecretValues = () => {
    return secretValues;
}