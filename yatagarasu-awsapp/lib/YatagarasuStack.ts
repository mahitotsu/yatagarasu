import { RemovalPolicy, ScopedAws, SecretValue, Stack, StackProps } from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { AllowedMethods, CachePolicy, CfnDistribution, CfnOriginAccessControl, Distribution, OriginRequestPolicy, ResponseHeadersPolicy } from "aws-cdk-lib/aws-cloudfront";
import { FunctionUrlOrigin, S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Mfa, OAuthScope, UserPool } from "aws-cdk-lib/aws-cognito";
import { Effect, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Alias, Architecture, FunctionUrlAuthType, InvokeMode, LayerVersion, LoggingFormat, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { ARecord, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget, UserPoolDomainTarget } from "aws-cdk-lib/aws-route53-targets";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export class YatagarasuStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        const { accountId } = new ScopedAws(this);

        // ==========
        // Global certificates and Public hostedzone
        // ==========
        const certificate = Certificate.fromCertificateArn(this, 'certificate',
            `arn:aws:acm:us-east-1:${this.account}:certificate/053dc7b0-3805-42bd-8d17-28db8cc027bc`);
        const hostedzone = PublicHostedZone.fromHostedZoneAttributes(this, 'hostedzone', {
            hostedZoneId: 'Z00285912B2ULPDZAM9V9', zoneName: 'mahitotsu.com',
        });
        const www = "www";
        const auth = "auth";

        // ==========
        // Authentication
        // ==========
        const userpool = new UserPool(this, 'userpool', {
            selfSignUpEnabled: false,
            signInAliases: { username: false, email: true, phone: false, preferredUsername: false },
            autoVerify: { email: true, phone: true, },
            standardAttributes: { email: { mutable: false, required: true }, },
            mfa: Mfa.OFF,
        });
        const authDomain = userpool.addDomain('domain', {
            customDomain: {
                domainName: `${auth}.${hostedzone.zoneName}`,
                certificate: certificate,
            },
        });
        const callbackUrl = `https://${www}.${hostedzone.zoneName}/oauth2/idpresponse`;
        const authClient = userpool.addClient('client', {
            generateSecret: true,
            oAuth: {
                flows: { authorizationCodeGrant: true, implicitCodeGrant: false },
                scopes: [OAuthScope.EMAIL, OAuthScope.OPENID],
                callbackUrls: [callbackUrl],
            },
        });

        const authRecord = new ARecord(authDomain, 'record', {
            zone: hostedzone,
            recordName: auth,
            target: RecordTarget.fromAlias(new UserPoolDomainTarget(authDomain)),
        });

        // ==========
        // Store secret values
        // ==========
        const secret = new Secret(this, 'Secret', {
            secretObjectValue: {
                clientSecret: authClient.userPoolClientSecret,
                clientId: SecretValue.unsafePlainText(authClient.userPoolClientId),
                callbackUrl: SecretValue.unsafePlainText(callbackUrl),
            },
            removalPolicy: RemovalPolicy.DESTROY,
        });

        // ==========
        // Static contents for Webapp
        // ==========
        const content = new Bucket(this, 'content', {
            removalPolicy: RemovalPolicy.DESTROY,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        });
        new BucketDeployment(content, 'deployment', {
            destinationBucket: content,
            destinationKeyPrefix: '',
            sources: [Source.asset(`${__dirname}/../../yatagarasu-webapp/.output/public`)],
            memoryLimit: 1024,
            logGroup: new LogGroup(this, 'content-deployment-loggroup', {
                retention: RetentionDays.ONE_DAY,
                removalPolicy: RemovalPolicy.DESTROY,
            }),
        });

        // ==========
        // Lambda function for Webapp
        // ==========
        const powertools = LayerVersion.fromLayerVersionArn(this, 'powertools',
            `arn:aws:lambda:${this.region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:12`
        );
        const webapp = new NodejsFunction(this, 'webapp', {
            runtime: Runtime.NODEJS_20_X,
            architecture: Architecture.ARM_64,
            entry: `${__dirname}/../../yatagarasu-webapp/.output/server/index.mjs`,
            environment: {
                NUXT_WEB_DOMAIN: `${www}.${hostedzone.zoneName}`,
                NUXT_AUTH_DOMAIN: `${auth}.${hostedzone.zoneName}`,
                NUXT_SECRET_NAME: secret.secretName,
            },
            bundling: {
                minify: true,
                sourceMap: false,
                externalModules: ['@aws-lambda-powertools/*', '@aws-sdk/*',],
            },
            layers: [powertools],
            memorySize: 1024,
            loggingFormat: LoggingFormat.JSON,
            logGroup: new LogGroup(this, 'webapp-loggroup', {
                retention: RetentionDays.ONE_DAY,
                removalPolicy: RemovalPolicy.DESTROY,
            }),
        });
        const current = new Alias(webapp, 'current', {
            aliasName: 'current',
            version: webapp.currentVersion,
        });
        const endpoint = current.addFunctionUrl({
            authType: FunctionUrlAuthType.AWS_IAM,
            invokeMode: InvokeMode.BUFFERED,
        });

        secret.grantRead(current);

        // ==========
        // Distribution of webapp
        // ==========
        const distribution = new Distribution(this, 'distribution', {
            defaultBehavior: {
                origin: new FunctionUrlOrigin(endpoint),
                allowedMethods: AllowedMethods.ALLOW_ALL,
                cachePolicy: CachePolicy.CACHING_DISABLED,
                originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS
            },
            additionalBehaviors: {
                '*.*': {
                    origin: new S3Origin(content),
                    allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                    cachePolicy: CachePolicy.CACHING_DISABLED,
                    originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                    responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS
                }
            },
            domainNames: [`${www}.${hostedzone.zoneName}`],
            certificate: certificate,
        });
        const cfnDistribution = distribution.node.defaultChild as CfnDistribution;

        const oacLambda = new CfnOriginAccessControl(distribution, 'oacLambda', {
            originAccessControlConfig: {
                name: 'oac-lambda',
                description: 'yatagarasu-oac-lambda',
                originAccessControlOriginType: 'lambda',
                signingBehavior: 'always',
                signingProtocol: 'sigv4',
            }
        });
        cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', oacLambda.attrId);
        current.addPermission('lambda-invocation', {
            principal: new ServicePrincipal('cloudfront.amazonaws.com'),
            action: 'lambda:InvokeFunctionUrl',
            sourceArn: `arn:aws:cloudfront::${accountId}:distribution/${distribution.distributionId}`,
        });

        const oacS3 = new CfnOriginAccessControl(distribution, 'oacS3', {
            originAccessControlConfig: {
                name: 'oac-s3',
                description: 'yatagarasu-oac-s3',
                originAccessControlOriginType: 's3',
                signingBehavior: 'always',
                signingProtocol: 'sigv4',
            }
        });
        cfnDistribution.addPropertyOverride('DistributionConfig.Origins.1.S3OriginConfig.OriginAccessIdentity', '');
        cfnDistribution.addPropertyOverride('DistributionConfig.Origins.1.OriginAccessControlId', oacS3.attrId);
        content.addToResourcePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            principals: [new ServicePrincipal('cloudfront.amazonaws.com')],
            actions: ['s3:GetObject'],
            resources: [content.arnForObjects('*')],
            conditions: {
                'StringEquals': {
                    'AWS:SourceArn': `arn:aws:cloudfront::${accountId}:distribution/${distribution.distributionId}`
                }
            }
        }));

        new ARecord(distribution, 'record', {
            zone: hostedzone,
            recordName: www,
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
        });
    }
}