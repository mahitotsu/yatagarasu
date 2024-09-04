import { CustomResource, Duration, RemovalPolicy, ScopedAws, SecretValue, Stack, StackProps } from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { AllowedMethods, CachePolicy, CfnDistribution, CfnOriginAccessControl, Distribution, KeyGroup, OriginRequestPolicy, PublicKey, ResponseHeadersPolicy } from "aws-cdk-lib/aws-cloudfront";
import { FunctionUrlOrigin, S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Mfa, OAuthScope, UserPool } from "aws-cdk-lib/aws-cognito";
import { Effect, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Key, KeySpec, KeyUsage } from "aws-cdk-lib/aws-kms";
import { Architecture, FunctionUrlAuthType, InvokeMode, LayerVersion, LoggingFormat, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { ARecord, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget, UserPoolDomainTarget } from "aws-cdk-lib/aws-route53-targets";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Provider } from "aws-cdk-lib/custom-resources";
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
        const logoutUrl = `https://${www}.${hostedzone.zoneName}/`;
        const authClient = userpool.addClient('client', {
            generateSecret: true,
            oAuth: {
                flows: { authorizationCodeGrant: true, implicitCodeGrant: false },
                scopes: [OAuthScope.EMAIL, OAuthScope.OPENID],
                callbackUrls: [callbackUrl],
                logoutUrls: [logoutUrl],
            },

        });

        new ARecord(authDomain, 'record', {
            zone: hostedzone,
            recordName: auth,
            target: RecordTarget.fromAlias(new UserPoolDomainTarget(authDomain)),
        });

        // ==========
        // Store key and secrets
        // ==========
        const cryptKey = new Key(this, 'cryptKey', {
            enableKeyRotation: false,
            keySpec: KeySpec.SYMMETRIC_DEFAULT,
            keyUsage: KeyUsage.ENCRYPT_DECRYPT,
            removalPolicy: RemovalPolicy.DESTROY,
            pendingWindow: Duration.days(7),
        });
        const keyPairGenerator = new NodejsFunction(cryptKey, 'keyPairGenerator', {
            entry: `${__dirname}/KeyPairGenerator.ts`,
            environment: { KEY_ID: cryptKey.keyId },
            logGroup: new LogGroup(cryptKey, 'keyPairGenerator-loggroup', {
                retention: RetentionDays.ONE_DAY,
                removalPolicy: RemovalPolicy.DESTROY,
            })
        });
        cryptKey.grantEncrypt(keyPairGenerator);
        const provider = new Provider(this, 'provider', {
            onEventHandler: keyPairGenerator,
            logGroup: new LogGroup(this, 'provider-loggroup', {
                retention: RetentionDays.ONE_DAY,
                removalPolicy: RemovalPolicy.DESTROY,
            })
        });
        const keyPair = new CustomResource(provider, 'keyPair', {
            serviceToken: provider.serviceToken,
            removalPolicy: RemovalPolicy.DESTROY
        });
        const pubKey = new PublicKey(this, 'pubKey', { encodedKey: keyPair.getAttString('publicKey') });
        const keyGroup = new KeyGroup(this, 'keyGroup', { items: [pubKey] });

        const secret = new Secret(this, 'secret', {
            secretObjectValue: {
                userPoolId: SecretValue.unsafePlainText(userpool.userPoolId),
                clientSecret: authClient.userPoolClientSecret,
                clientId: SecretValue.unsafePlainText(authClient.userPoolClientId),
                callbackUrl: SecretValue.unsafePlainText(callbackUrl),
                cryptKeyId: SecretValue.unsafePlainText(cryptKey.keyId),
                publicKeyId: SecretValue.unsafePlainText(pubKey.publicKeyId),
                encryptedPrivateKey: SecretValue.unsafePlainText(keyPair.getAttString('encryptedPrivateKey')),
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
                YTG_WEB_DOMAIN: `${www}.${hostedzone.zoneName}`,
                YTG_AUTH_DOMAIN: `${auth}.${hostedzone.zoneName}`,
                YTG_SECRET_NAME: secret.secretName,
            },
            bundling: {
                minify: true,
                sourceMap: false,
                externalModules: ['@aws-lambda-powertools/*', '@aws-sdk/*',],
                format: OutputFormat.ESM,
            },
            layers: [powertools],
            memorySize: 1024,
            loggingFormat: LoggingFormat.JSON,
            logGroup: new LogGroup(this, 'webapp-loggroup', {
                retention: RetentionDays.ONE_DAY,
                removalPolicy: RemovalPolicy.DESTROY,
            }),
        });
        const endpoint = webapp.addFunctionUrl({
            authType: FunctionUrlAuthType.AWS_IAM,
            invokeMode: InvokeMode.BUFFERED,
        });

        secret.grantRead(webapp);
        cryptKey.grantDecrypt(webapp);

        // ==========
        // Distribution of webapp
        // ==========
        const webappBehaviorOptions = {
            origin: new FunctionUrlOrigin(endpoint),
            allowedMethods: AllowedMethods.ALLOW_ALL,
            cachePolicy: CachePolicy.CACHING_DISABLED,
            originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
            responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS,
        };
        const contentsBehaviorOptions = {
            origin: new S3Origin(content),
            allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            cachePolicy: CachePolicy.CACHING_DISABLED,
            originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
            responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS,
        };

        const distribution = new Distribution(this, 'distribution', {
            additionalBehaviors: {
                '/oauth2/*': { ...webappBehaviorOptions },
                'favicon.ico': { ...contentsBehaviorOptions },
                '*.*': { ...contentsBehaviorOptions, trustedKeyGroups: [keyGroup], },
            },
            defaultBehavior: { ...webappBehaviorOptions, trustedKeyGroups: [keyGroup], },
            domainNames: [`${www}.${hostedzone.zoneName}`],
            certificate: certificate,
            errorResponses: [
                { httpStatus: 403, responseHttpStatus: 403, responsePagePath: '/oauth2/signin' },
            ]
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
        webapp.addPermission('lambda-invocation', {
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