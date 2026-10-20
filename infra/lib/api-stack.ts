import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib';
import { HttpApi, HttpMethod, HttpStage } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import type { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import type { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import type { Construct } from 'constructs';
import { BitewiseFunction } from './bitewise-function';

export interface ApiStackProps extends StackProps {
  table: TableV2;
  userPool: UserPool;
  userPoolClient: UserPoolClient;
}

// What each resource Lambda may do on the table (exactly the console's inline policies).
// Transactions need no action of their own: each item in one is checked as Put/Update/Delete/ConditionCheck.
const OWNED_ITEMS = [
  'dynamodb:Query',
  'dynamodb:GetItem',
  'dynamodb:BatchGetItem',
  'dynamodb:PutItem',
  'dynamodb:UpdateItem',
  'dynamodb:DeleteItem',
  'dynamodb:ConditionCheckItem',
];

const RESOURCES = [
  { name: 'ingredients', path: '/api/ingredient', actions: OWNED_ITEMS },
  // Meals update Ingredients' usedBy, Meal plans update Meals': same table, same actions
  { name: 'meals', path: '/api/meal', actions: OWNED_ITEMS },
  { name: 'meal-plans', path: '/api/meal-plan', actions: OWNED_ITEMS },
  {
    name: 'users',
    path: '/api/users/me',
    // No Cognito actions: GetUser/DeleteUser use the caller's access token
    actions: [
      'dynamodb:Query',
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
      'dynamodb:BatchWriteItem',
    ],
  },
] as const;

/** HTTP API, JWT authorizer and resource Lambdas (runbook section 4). */
export class ApiStack extends Stack {
  readonly api: HttpApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    this.api = new HttpApi(this, 'HttpApi', { apiName: 'bitewise-sls', createDefaultStage: false });
    // A standalone HttpStage: api.addStage() with the name $default renders the API twice (CDK bug)
    new HttpStage(this, 'DefaultStage', {
      httpApi: this.api,
      stageName: '$default',
      autoDeploy: true,
      // No WAF in front of the API: this caps a runaway client or a cheap flood
      throttle: { rateLimit: 20, burstLimit: 40 },
    });

    // Checks signature, expiry, issuer and audience (an access token's client_id) before any Lambda runs
    const authorizer = new HttpJwtAuthorizer(
      'cognito',
      `https://cognito-idp.${this.region}.amazonaws.com/${props.userPool.userPoolId}`,
      { jwtAudience: [props.userPoolClient.userPoolClientId], identitySource: ['$request.header.Authorization'] },
    );

    for (const resource of RESOURCES) {
      const { fn } = new BitewiseFunction(this, resource.name, {
        name: resource.name,
        entry: `handlers/${resource.name}.ts`,
        environment: { TABLE_NAME: props.table.tableName },
        timeout: Duration.seconds(10),
      });
      props.table.grant(fn, ...resource.actions);

      // One integration for both routes; the Lambda dispatches on method and path
      const integration = new HttpLambdaIntegration(`${resource.name}-integration`, fn);
      for (const path of [resource.path, `${resource.path}/{proxy+}`]) {
        this.api.addRoutes({ path, methods: [HttpMethod.ANY], integration, authorizer });
      }
    }

    new CfnOutput(this, 'ApiEndpoint', { value: this.api.apiEndpoint });
  }
}
