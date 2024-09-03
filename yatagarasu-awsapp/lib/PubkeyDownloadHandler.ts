import { GetPublicKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { CdkCustomResourceHandler } from "aws-lambda";

const kmsClient = new KMSClient();
const keyId = process.env.KEY_ID;

export const handler: CdkCustomResourceHandler = async (event) => {

    switch (event.RequestType) {
        case 'Create':
        case 'Update':
            const command = new GetPublicKeyCommand({ KeyId: keyId });
            const response = await kmsClient.send(command);
            return { Data: { publicKey: topem(response.PublicKey) } };
        case 'Delete':
        default:
            return {};
    }
}

const topem = (binary?: Uint8Array): string => {
    return [
        '-----BEGIN PUBLIC KEY-----',
        Buffer.from(binary || '').toString('base64').match(/.{1,64}/g)?.join('\n') || '',
        '-----END PUBLIC KEY-----'
    ].join('\n')
}