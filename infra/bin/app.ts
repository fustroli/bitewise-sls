import { App, Tags } from 'aws-cdk-lib';
import { ApiStack } from '../lib/api-stack';
import { AuthStack } from '../lib/auth-stack';
import { DataStack } from '../lib/data-stack';
import { WebStack } from '../lib/web-stack';

const app = new App();

// Account comes from the CLI profile; synth works without credentials.
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' };
const domainName = 'sls.bitewise.rolandfuest.com';

new DataStack(app, 'bitewise-sls-data', { env });
new AuthStack(app, 'bitewise-sls-auth', { env });
new ApiStack(app, 'bitewise-sls-api', { env });
new WebStack(app, 'bitewise-sls-web', { env, domainName });

// Inherited by every taggable resource in every stack.
Tags.of(app).add('app', 'bitewise-sls');
