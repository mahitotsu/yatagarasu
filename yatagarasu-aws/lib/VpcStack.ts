import { Stack, StackProps } from "aws-cdk-lib";
import { IpAddresses, IVpc, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

interface VpcStackProps extends StackProps {
    cidr: string;
    publicSubnetCidrMask: number;
    privateSubnetCidrMask: number;
}

export class VpcStack extends Stack {
    constructor(scope: Construct, id: string, props: VpcStackProps) {
        super(scope, id, props);

        const vpc = new Vpc(this, 'Vpc', {
            createInternetGateway: false,
            natGateways: 0,
            ipAddresses: IpAddresses.cidr(props.cidr),
            subnetConfiguration: [{
                name: 'Public',
                subnetType: SubnetType.PUBLIC,
                cidrMask: props.publicSubnetCidrMask,
            },{
                name: 'Isolated',
                subnetType: SubnetType.PRIVATE_ISOLATED,
                cidrMask: props.privateSubnetCidrMask,
            }],
        });

        this._vpc = vpc;
    }

    private _vpc: IVpc;

    get vpc(): IVpc { return this._vpc; }
}