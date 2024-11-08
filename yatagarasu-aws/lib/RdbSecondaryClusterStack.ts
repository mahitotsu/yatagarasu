import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { IVpc, SubnetSelection } from "aws-cdk-lib/aws-ec2";
import { CfnDBCluster, ClusterInstance, DatabaseCluster, IClusterEngine } from "aws-cdk-lib/aws-rds";

interface RdbSecondaryClusterStackProps extends StackProps {
    vpc: IVpc,
    vpcSubnets: SubnetSelection,
    rdbClusterEngine: IClusterEngine,
    globalClusterIdentifier: string,
}

export class RdbSecondaryClusterStack extends Stack {
    constructor(scope: any, id: string, props: RdbSecondaryClusterStackProps) {
        super(scope, id, props);

        const dbCluster = new DatabaseCluster(this, 'RdbSecondryCluster', {
            engine: props.rdbClusterEngine,
            vpc: props.vpc,
            vpcSubnets: props.vpcSubnets,
            writer: ClusterInstance.serverlessV2('Writer'),
            readers: [ClusterInstance.serverlessV2('Reader', { scaleWithWriter: true })],
            serverlessV2MinCapacity: 0.5,
            deletionProtection: false,
            removalPolicy: RemovalPolicy.DESTROY,
        });
        const cfnRdb = dbCluster.node.defaultChild as CfnDBCluster;
        cfnRdb.masterUsername = undefined;
        cfnRdb.masterUserPassword = undefined;
        cfnRdb.globalClusterIdentifier = props.globalClusterIdentifier;
    }
}