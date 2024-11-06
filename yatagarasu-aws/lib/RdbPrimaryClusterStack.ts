import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { IVpc, SubnetSelection } from "aws-cdk-lib/aws-ec2";
import { CfnGlobalCluster, ClusterInstance, DatabaseCluster, IClusterEngine } from "aws-cdk-lib/aws-rds";

interface RdbPrimaryClusterStackProps extends StackProps {
    vpc: IVpc,
    vpcSubnets: SubnetSelection,
    rdbClusterEngine: IClusterEngine,
}

export class RdbPrimaryClusterStack extends Stack {
    constructor(scope: any, id: string, props: RdbPrimaryClusterStackProps) {
        super(scope, id, props);

        const dbCluster = new DatabaseCluster(this, 'RdbPrimaryCluster', {
            engine: props.rdbClusterEngine,
            vpc: props.vpc,
            vpcSubnets: props.vpcSubnets,
            writer: ClusterInstance.serverlessV2,
            serverlessV2MinCapacity: 0.5,
            deletionProtection: false,
            removalPolicy: RemovalPolicy.DESTROY,
        });
        const globalDb = new CfnGlobalCluster(this, 'GlobalCluster', {
            engineVersion: dbCluster.engine?.engineVersion?.fullVersion,
            sourceDbClusterIdentifier: dbCluster.clusterIdentifier,
            deletionProtection: false,
        });

        this._globalClusterIndentifier = globalDb.globalClusterIdentifier!;
    }

    private _globalClusterIndentifier: string;

    get globalClusterIndentifier() { return this._globalClusterIndentifier; }
}