#!/usr/bin/env node
import { App, Environment } from 'aws-cdk-lib';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { AuroraPostgresEngineVersion, DatabaseClusterEngine } from 'aws-cdk-lib/aws-rds';
import 'source-map-support/register';
import { RdbPrimaryClusterStack } from '../lib/RdbPrimaryClusterStack';
import { RdbSecondaryClusterStack } from '../lib/RdbSecondaryClusterStack';
import { VpcPeeringGuestStack } from '../lib/VpcPeeringGuestStack';
import { VpcPeeringOwnerStack } from '../lib/VpcPeeringOwnerStack';
import { VpcStack } from '../lib/VpcStack';

interface RegionConfig {
  env: Environment,
  vpcCidr: string;
  publicSubnetCidrMask: number,
  privateSubnetCidrMask: number,
};

const app = new App();
const account = process.env.CDK_DEFAULT_ACCOUNT;
const rdbClusterEngine = DatabaseClusterEngine.auroraPostgres({version: AuroraPostgresEngineVersion.VER_16_3});

const hndConfig = {
  env: { account, region: 'ap-northeast-1' },
  vpcCidr: '10.0.0.0/16',
  publicSubnetCidrMask: 20,
  privateSubnetCidrMask: 18,
} as RegionConfig;

const kixConfig = {
  env: { account, region: 'ap-northeast-3' },
  region: 'ap-northeast-3',
  vpcCidr: '10.1.0.0/16',
  publicSubnetCidrMask: 20,
  privateSubnetCidrMask: 18,
} as RegionConfig;


const hndVpcStack = new VpcStack(app, 'HndVpcStack', {
  env: hndConfig.env,
  crossRegionReferences: true,
  cidr: hndConfig.vpcCidr,
  publicSubnetCidrMask: hndConfig.publicSubnetCidrMask,
  privateSubnetCidrMask: hndConfig.privateSubnetCidrMask,
});
const kixVpcStack = new VpcStack(app, 'KixVpcStack', {
  env: kixConfig.env,
  crossRegionReferences: true,
  cidr: kixConfig.vpcCidr,
  publicSubnetCidrMask: kixConfig.publicSubnetCidrMask,
  privateSubnetCidrMask: kixConfig.privateSubnetCidrMask,
});

const hndVpcPeeringStack = new VpcPeeringOwnerStack(app, 'HndVpcPeeringStack', {
  env: hndConfig.env,
  crossRegionReferences: true,
  vpcId: hndVpcStack.vpc.vpcId,
  peeringVpcId: kixVpcStack.vpc.vpcId,
  peerRegion: kixConfig.env.region!,
  peerCidrBlock: kixVpcStack.vpc.vpcCidrBlock,
  routeTableIds: hndVpcStack.vpc.isolatedSubnets.map(subnet => subnet.routeTable.routeTableId),
});
new VpcPeeringGuestStack(app, 'KixVpcPeeringStack', {
  env: kixConfig.env,
  crossRegionReferences: true,
  vpcPeeringId: hndVpcPeeringStack.vpcPeeringConnectionId,
  vpcCiddrBlock: hndVpcStack.vpc.vpcCidrBlock,
  routeTableIds: kixVpcStack.vpc.isolatedSubnets.map(subnet => subnet.routeTable.routeTableId),
});

const hndRdbClusterStack = new RdbPrimaryClusterStack(app, 'HndRdbClusterStack', {
  env: hndConfig.env,
  crossRegionReferences: true,
  vpc: hndVpcStack.vpc,
  vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
  rdbClusterEngine: rdbClusterEngine,
});
const rdbSecondaryClusterStack = new RdbSecondaryClusterStack(app, 'KixRdbClusterStack', {
  env: kixConfig.env,
  crossRegionReferences: true,
  vpc: kixVpcStack.vpc,
  vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
  rdbClusterEngine: rdbClusterEngine,
  globalClusterIdentifier: hndRdbClusterStack.globalClusterIndentifier,
});