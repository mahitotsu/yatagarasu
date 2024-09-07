import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { H3Event, type EventHandlerRequest } from 'h3';

const s3Client = new S3Client();
const bucketName = process.env.BUCKET_NAME;

export const s3ObjectHandler = async (event: H3Event<EventHandlerRequest>) => {
    return s3Client.send(
        new GetObjectCommand({
            Bucket: bucketName,
            Key: event.node.req.url?.split('?')[0].substring(1),
        })
    ).then(response => {
        setHeaders(event, {
            'Content-Type': response.ContentType,
            'ETag': response.ETag,
            'Last-Modified': response.LastModified,
            'Content-Length': response.ContentLength?.toString(),
        });
        return sendStream(event, response.Body as ReadableStream<Uint8Array>);
    });
}