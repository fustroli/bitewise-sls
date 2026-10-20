import { App, Tags } from 'aws-cdk-lib';
import { ApiStack } from '../lib/api-stack';
import { AuthStack } from '../lib/auth-stack';
import { DataStack } from '../lib/data-stack';
import { WebStack } from '../lib/web-stack';

const app = new App();

// Account comes from the CLI profile; synth works without credentials.
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' };
const domainName = 'sls.bitewise.rolandfuest.com';

const data = new DataStack(app, 'bitewise-sls-data', { env });
const auth = new AuthStack(app, 'bitewise-sls-auth', { env, domainName, table: data.table });
const api = new ApiStack(app, 'bitewise-sls-api', {
  env,
  table: data.table,
  userPool: auth.userPool,
  userPoolClient: auth.client,
});
new WebStack(app, 'bitewise-sls-web', { env, domainName, api: api.api });

// Inherited by every taggable resource in every stack.
Tags.of(app).add('app', 'bitewise-sls');
