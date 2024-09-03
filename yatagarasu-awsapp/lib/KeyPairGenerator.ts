import { EncryptCommand, KMSClient } from '@aws-sdk/client-kms';
import { CdkCustomResourceHandler } from "aws-lambda";
import { generateKeyPairSync } from 'crypto';

const kmsClient = new KMSClient();
const keyId = process.env.KEY_ID;

export const handler: CdkCustomResourceHandler = async (event) => {

    switch (event.RequestType) {
        case 'Create':
            const { publicKey, privateKey } = generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'pkcs1',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs1',
                    format: 'pem',
                }
            });
            const encryptedPrivateKey = await kmsClient.send(new EncryptCommand({
                KeyId: keyId,
                Plaintext: Buffer.from(privateKey),
            }))
                .then(res => res.CiphertextBlob)
                .then(blob => Buffer.from(blob!).toString('base64'));
            return { Data: { publicKey, encryptedPrivateKey } };
        case 'Update':
        case 'Delete':
        default:
            return {};
    }
}