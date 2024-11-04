#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import 'source-map-support/register';
import { VpcPeeringGuestStack } from '../lib/VpcPeeringGuestStack';
import { VpcPeeringOwnerStack } from '../lib/VpcPeeringOwnerStack';
import { VpcStack } from '../lib/VpcStack';

interface RegionConfig {
  region: string;
  vpcCidr: string;
  publicSubnetCidrMask: number,
  privateSubnetCidrMask: number,
};

const app = new App();
const account = process.env.CDK_DEFAULT_ACCOUNT;

const hndConfig = {
  region: 'ap-northeast-1',
  vpcCidr: '10.0.0.0/16',
  publicSubnetCidrMask: 20,
  privateSubnetCidrMask: 18,
} as RegionConfig;

const kixConfig = {
  region: 'ap-northeast-3',
  vpcCidr: '10.1.0.0/16',
  publicSubnetCidrMask: 20,
  privateSubnetCidrMask: 18,
} as RegionConfig;


const hndVpcStack = new VpcStack(app, 'HndVpcStack', {
  env: { account, region: hndConfig.region },
  crossRegionReferences: true,
  cidr: hndConfig.vpcCidr,
  publicSubnetCidrMask: hndConfig.publicSubnetCidrMask,
  privateSubnetCidrMask: hndConfig.privateSubnetCidrMask,
});
const kixVpcStack = new VpcStack(app, 'KixVpcStack', {
  env: { account, region: kixConfig.region },
  crossRegionReferences: true,
  cidr: kixConfig.vpcCidr,
  publicSubnetCidrMask: kixConfig.publicSubnetCidrMask,
  privateSubnetCidrMask: kixConfig.privateSubnetCidrMask,
});

const vpcPeeringOwnerStack = new VpcPeeringOwnerStack(app, 'VpcPeeringOwnerStack', {
  env: { account, region: hndConfig.region },
  crossRegionReferences: true,
  vpcId: hndVpcStack.vpc.vpcId,
  peeringVpcId: kixVpcStack.vpc.vpcId,
  peerRegion: kixConfig.region,
  peerCidrBlock: kixVpcStack.vpc.vpcCidrBlock,
  routeTableIds: hndVpcStack.vpc.isolatedSubnets.map(subnet => subnet.routeTable.routeTableId),
});
new VpcPeeringGuestStack(app, 'VpcPeeringGuestStack', {
  env: { account, region: kixConfig.region },
  crossRegionReferences: true,
  vpcPeeringId: vpcPeeringOwnerStack.vpcPeeringConnectionId,
  vpcCiddrBlock: hndVpcStack.vpc.vpcCidrBlock,
  routeTableIds: kixVpcStack.vpc.isolatedSubnets.map(subnet => subnet.routeTable.routeTableId),
})