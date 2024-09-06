import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { APIGatewayProxyHandlerV2 } from "aws-lambda";

const webapp = require('../../yatagarasu-webapp/.output/server/index.mjs')
const s3Client = new S3Client();
const bucketName = process.env.BUCKET_NAME;

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {

    const path = event.requestContext.http.path;
    const hasExtension = path.split('?')[0].split('/').pop()?.includes('.');

    if (hasExtension) {
        const req = new GetObjectCommand({
            Bucket: bucketName,
            Key: path.split('?')[0].substring(1),
        });
        const res = await s3Client.send(req);
        const contents = await res.Body?.transformToByteArray();
        if (contents == undefined) {
            return {
                statusCode: 204,
            };
        } else {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': res.ContentType,
                    'ETag': res.ETag,
                    'Last-Modified': res.LastModified?.toUTCString(),
                },
                body: Buffer.from(contents).toString('base64'),
                isBase64Encoded: true,
            };
        }
    } else {
        return webapp.handler(event, context);
    }
}