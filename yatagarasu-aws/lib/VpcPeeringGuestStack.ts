import { Stack, StackProps } from "aws-cdk-lib";
import { CfnRoute } from "aws-cdk-lib/aws-ec2";

interface VpcPeeringGuestStackProps extends StackProps {
    vpcPeeringId: string,
    vpcCiddrBlock: string
    routeTableIds: string[],
}

export class VpcPeeringGuestStack extends Stack {
    constructor(scope: any, id: string, props: VpcPeeringGuestStackProps) {
        super(scope, id, props);

        props.routeTableIds.map((routeTableId, index) => {
            new CfnRoute(this, `PeerVpcRoute-${index}`, {
                routeTableId: routeTableId,
                destinationCidrBlock: props.vpcCiddrBlock,
                vpcPeeringConnectionId: props.vpcPeeringId,
            })
        });
    }
}