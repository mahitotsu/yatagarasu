import { Stack, StackProps } from "aws-cdk-lib";
import { CfnRoute, CfnVPCPeeringConnection } from "aws-cdk-lib/aws-ec2";

interface VpcPeeringOwnerStackProps extends StackProps {
    vpcId: string;
    peeringVpcId: string;
    peerRegion: string;
    peerCidrBlock: string;
    routeTableIds: string[];
}

export class VpcPeeringOwnerStack extends Stack {
    constructor(scope: any, id: string, props: VpcPeeringOwnerStackProps) {
        super(scope, id, props);

        const vpcPeering = new CfnVPCPeeringConnection(this, 'VPCPeeringConnection', {
            vpcId: props.vpcId,
            peerVpcId: props.peeringVpcId,
            peerRegion: props.peerRegion,
        });

        props.routeTableIds.map((routeTableId, index) => {
            new CfnRoute(this, `PeerVpcRoute-${index}`, {
                routeTableId: routeTableId,
                destinationCidrBlock: props.peerCidrBlock,
                vpcPeeringConnectionId: vpcPeering.ref
            })
        });

        this._vpcPeeringConnectionId = vpcPeering.ref;
    }

    private _vpcPeeringConnectionId: string;

    get vpcPeeringConnectionId(): string { return this._vpcPeeringConnectionId; }
}