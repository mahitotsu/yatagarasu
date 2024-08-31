#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import 'source-map-support/register';
import { YatagarasuStack } from '../lib/YatagarasuStack';

const app = new App();
new YatagarasuStack(app, 'YatagarasuStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-northeast-1' },
});