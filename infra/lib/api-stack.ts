import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib';
import { CfnStage, HttpApi, HttpMethod, HttpStage } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import type { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import type { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket, EventType, type IBucket } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import type { Construct } from 'constructs';
import { BitewiseFunction } from './bitewise-function';

export interface ApiStackProps extends StackProps {
  /** App domain: avatar URLs are `https://<domain>/avatars/...` (CloudFront). */
  domainName: string;
  table: TableV2;
  avatarBucket: IBucket;
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

const AVATAR_UPLOAD_ROUTE = '/api/users/me/avatar-upload';

/** HTTP API, JWT authorizer and resource Lambdas (runbook section 4), avatar processing (section 6). */
export class ApiStack extends Stack {
  readonly api: HttpApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    this.api = new HttpApi(this, 'HttpApi', { apiName: 'bitewise-sls', createDefaultStage: false });
    // A standalone HttpStage: api.addStage() with the name $default renders the API twice (CDK bug)
    const stage = new HttpStage(this, 'DefaultStage', {
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

    const avatars = props.avatarBucket;
    for (const resource of RESOURCES) {
      const isUsers = resource.name === 'users';
      const { fn } = new BitewiseFunction(this, resource.name, {
        name: resource.name,
        entry: `handlers/${resource.name}.ts`,
        environment: {
          TABLE_NAME: props.table.tableName,
          ...(isUsers && { AVATAR_BUCKET: avatars.bucketName, AVATAR_BASE_URL: `https://${props.domainName}` }),
        },
        timeout: Duration.seconds(10),
      });
      props.table.grant(fn, ...resource.actions);

      // One integration for both routes; the Lambda dispatches on method and path
      const integration = new HttpLambdaIntegration(`${resource.name}-integration`, fn);
      for (const path of [resource.path, `${resource.path}/{proxy+}`]) {
        this.api.addRoutes({ path, methods: [HttpMethod.ANY], integration, authorizer });
      }

      if (isUsers) {
        // Console inline policy `users-avatars`. PutObject because the presigned POST is signed with
        // this role: S3 checks the signer may write the key.
        fn.addToRolePolicy(new PolicyStatement({ actions: ['s3:PutObject'], resources: [avatars.arnForObjects('uploads/*')] }));
        fn.addToRolePolicy(new PolicyStatement({ actions: ['s3:DeleteObject'], resources: [avatars.arnForObjects('avatars/*')] }));
        fn.addToRolePolicy(
          new PolicyStatement({
            actions: ['s3:ListBucket'],
            resources: [avatars.bucketArn],
            conditions: { StringLike: { 's3:prefix': 'avatars/*' } },
          }),
        );

        // Its own route so it can have its own throttle; wins over /{proxy+} as the more specific path
        const [route] = this.api.addRoutes({ path: AVATAR_UPLOAD_ROUTE, methods: [HttpMethod.POST], integration, authorizer });
        // HttpStage has no route settings: escape hatch to the CloudFormation stage
        (stage.node.defaultChild as CfnStage).routeSettings = {
          [`POST ${AVATAR_UPLOAD_ROUTE}`]: { throttlingRateLimit: 2, throttlingBurstLimit: 5 },
        };
        // The route key must exist before the stage refers to it
        stage.node.addDependency(route!);
      }
    }

    this.avatarProcessor(props, avatars);

    new CfnOutput(this, 'ApiEndpoint', { value: this.api.apiEndpoint });
  }

  /** S3 `uploads/` → re-encode to `avatars/` → Profile's avatarKey (console: same settings). */
  private avatarProcessor(props: ApiStackProps, avatars: IBucket) {
    const { fn } = new BitewiseFunction(this, 'avatar-processor', {
      name: 'avatar-processor',
      entry: 'triggers/avatar-processor.ts',
      prebuilt: true,
      // CPU scales with memory; sharp is CPU-bound
      memorySize: 1024,
      timeout: Duration.seconds(30),
      environment: { TABLE_NAME: props.table.tableName, AVATAR_BUCKET: avatars.bucketName },
    });
    fn.addToRolePolicy(
      new PolicyStatement({ actions: ['s3:GetObject', 's3:DeleteObject'], resources: [avatars.arnForObjects('uploads/*')] }),
    );
    fn.addToRolePolicy(
      new PolicyStatement({ actions: ['s3:PutObject', 's3:DeleteObject'], resources: [avatars.arnForObjects('avatars/*')] }),
    );
    props.table.grant(fn, 'dynamodb:UpdateItem');

    // Through a reference, not the Data stack's Bucket: notifications on that one would live in the
    // Data stack and point at this Lambda, a cycle (Api already depends on Data).
    // CDK writes notifications with a custom resource (BucketNotificationsHandler), unlike the console.
    Bucket.fromBucketArn(this, 'AvatarBucketRef', avatars.bucketArn).addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(fn),
      { prefix: 'uploads/' },
    );
  }
}
