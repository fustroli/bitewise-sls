import { App, Tags } from 'aws-cdk-lib';
import { ApiStack } from '../lib/api-stack';
import { AuthStack } from '../lib/auth-stack';
import { DataStack } from '../lib/data-stack';
import { WebStack } from '../lib/web-stack';

const app = new App();
const stage: string = app.node.tryGetContext('stage') ?? 'dev';
const prefix = `bitewise-sls-${stage}`;

// Account comes from the CLI profile; synth works without credentials.
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' };

new DataStack(app, `${prefix}-data`, { env });
new AuthStack(app, `${prefix}-auth`, { env });
new ApiStack(app, `${prefix}-api`, { env });
new WebStack(app, `${prefix}-web`, { env });

// Inherited by every taggable resource in every stack.
Tags.of(app).add('app', 'bitewise-sls');
Tags.of(app).add('stage', stage);
