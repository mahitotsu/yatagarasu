#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import 'source-map-support/register';
import { YtgStack } from '../lib/YtgStack';

const app = new App();
new YtgStack(app, 'YtgStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-northeast-1', }
})