import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Alias, Architecture, FunctionUrlAuthType, InvokeMode, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

export class YtgStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const bucket = new Bucket(this, 'contents', {
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        });
        new BucketDeployment(bucket, 'deployment', {
            destinationBucket: bucket,
            destinationKeyPrefix: '',
            sources: [Source.asset(`${__dirname}/../../yatagarasu-webapp/.output/public/`)],
            memoryLimit: 1024,
            logGroup: new LogGroup(this, 'deploymentLog', {
                retention: RetentionDays.ONE_DAY,
                removalPolicy: RemovalPolicy.DESTROY,
            }),
        });

        const webapp = new NodejsFunction(this, 'webapp', {
            entry: `${__dirname}/WebappHandler.ts`,
            environment: {
                BUCKET_NAME: bucket.bucketName,
            },
            runtime: Runtime.NODEJS_20_X,
            architecture: Architecture.ARM_64,
            memorySize: 512,
            logGroup: new LogGroup(this, 'webapp-log', {
                retention: RetentionDays.ONE_DAY,
                removalPolicy: RemovalPolicy.DESTROY,
            }),
            bundling: {
                minify: true,
                externalModules: [
                    '@aws-sdk/*',
                ],
                format: OutputFormat.ESM,
                target: 'es2020'
            },
        });
        const alias = new Alias(this, 'webapp-alias', {
            aliasName: 'current',
            version: webapp.currentVersion,
        });
        const endpoint = alias.addFunctionUrl({
            invokeMode: InvokeMode.BUFFERED,
            authType: FunctionUrlAuthType.NONE,
        });
        bucket.grantRead(webapp);

        new CfnOutput(this, 'webapp-endpoint', {
            value: endpoint.url,
        });
    }
}