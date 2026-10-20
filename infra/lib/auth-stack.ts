import { CfnOutput, Duration, RemovalPolicy, SecretValue, Stack, type StackProps } from 'aws-cdk-lib';
import {
  AccountRecovery,
  CfnManagedLoginBranding,
  FeaturePlan,
  ManagedLoginVersion,
  Mfa,
  OAuthScope,
  ProviderAttribute,
  UserPool,
  type UserPoolClient,
  UserPoolClientIdentityProvider,
  UserPoolEmail,
  UserPoolIdentityProviderGoogle,
  UserPoolOperation,
} from 'aws-cdk-lib/aws-cognito';
import type { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import type { Construct } from 'constructs';
import { BitewiseFunction } from './bitewise-function';

export interface AuthStackProps extends StackProps {
  /** App domain, e.g. sls.bitewise.rolandfuest.com; callback, sign-out and email links. */
  domainName: string;
  table: TableV2;
}

/**
 * Cognito User Pool, Google IdP and trigger Lambdas (runbook section 3).
 *
 * Before a deploy, outside CloudFormation:
 * - SSM String parameter `/bitewise-sls/google-client-id` (the shared EC2 app client);
 * - Secrets Manager secret `bitewise-sls/google-client-secret` (a secret added to that client).
 *   Not an SSM SecureString: CloudFormation can't resolve those for Cognito identity providers.
 */
export class AuthStack extends Stack {
  readonly userPool: UserPool;
  readonly client: UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);
    const appUrl = `https://${props.domainName}`;

    const customMessage = new BitewiseFunction(this, 'CustomMessage', {
      name: 'custom-message',
      entry: 'triggers/custom-message.ts',
      environment: { APP_URL: appUrl },
    });
    const postConfirmation = new BitewiseFunction(this, 'PostConfirmation', {
      name: 'post-confirmation',
      entry: 'triggers/post-confirmation.ts',
      environment: { TABLE_NAME: props.table.tableName },
    });
    const preSignUp = new BitewiseFunction(this, 'PreSignUp', {
      name: 'pre-sign-up',
      entry: 'triggers/pre-sign-up.ts',
    });

    this.userPool = new UserPool(this, 'UserPool', {
      userPoolName: 'bitewise-sls',
      featurePlan: FeaturePlan.ESSENTIALS,
      signInAliases: { email: true },
      signInCaseSensitive: false,
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      // Pending email changes don't take sign-in away from the current address
      keepOriginal: { email: true },
      standardAttributes: { email: { required: true, mutable: true } },
      passwordPolicy: { minLength: 8, requireLowercase: true, requireUppercase: true, requireDigits: true, requireSymbols: true },
      mfa: Mfa.OFF,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      email: UserPoolEmail.withSES({
        sesRegion: 'us-east-1',
        sesVerifiedDomain: 'rolandfuest.com',
        fromEmail: 'no-reply@rolandfuest.com',
        fromName: 'BiteWise',
      }),
      deletionProtection: false,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    this.userPool.addTrigger(UserPoolOperation.CUSTOM_MESSAGE, customMessage.fn);
    this.userPool.addTrigger(UserPoolOperation.POST_CONFIRMATION, postConfirmation.fn);
    this.userPool.addTrigger(UserPoolOperation.PRE_SIGN_UP, preSignUp.fn);

    props.table.grant(postConfirmation.fn, 'dynamodb:PutItem');
    // A separate Policy, not addToRolePolicy: the function would depend on its default policy,
    // which references the pool, which references the function (circular dependency).
    new Policy(this, 'PreSignUpLinkUsers', {
      roles: [preSignUp.fn.role!],
      statements: [
        new PolicyStatement({
          actions: ['cognito-idp:ListUsers', 'cognito-idp:AdminLinkProviderForUser', 'cognito-idp:AdminDeleteUser'],
          resources: [this.userPool.userPoolArn],
        }),
      ],
    });

    // The hand-made pool kept quick setup's generated prefix; a rebuild gets a readable one.
    const domain = this.userPool.addDomain('Domain', {
      cognitoDomain: { domainPrefix: 'bitewise-sls' },
      managedLoginVersion: ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    });

    const google = new UserPoolIdentityProviderGoogle(this, 'Google', {
      userPool: this.userPool,
      clientId: StringParameter.valueForStringParameter(this, '/bitewise-sls/google-client-id'),
      clientSecretValue: SecretValue.secretsManager('bitewise-sls/google-client-secret'),
      scopes: ['openid', 'email', 'profile'],
      // email_verified gates linking in the pre-sign-up trigger
      attributeMapping: { email: ProviderAttribute.GOOGLE_EMAIL, emailVerified: ProviderAttribute.GOOGLE_EMAIL_VERIFIED },
    });

    const client = (this.client = this.userPool.addClient('WebClient', {
      userPoolClientName: 'bitewise-sls-web',
      generateSecret: false,
      // SRP only; refresh is always allowed
      authFlows: { userSrp: true },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE, OAuthScope.COGNITO_ADMIN],
        callbackUrls: [`${appUrl}/`, 'http://localhost:3000/'],
        logoutUrls: [`${appUrl}/`, 'http://localhost:3000/'],
      },
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO, UserPoolClientIdentityProvider.GOOGLE],
      accessTokenValidity: Duration.minutes(15),
      idTokenValidity: Duration.minutes(15),
      refreshTokenValidity: Duration.days(30),
      preventUserExistenceErrors: true,
      enableTokenRevocation: true,
    }));
    client.node.addDependency(google);

    // Default managed login style; the app uses its own pages, but the Google redirect passes through.
    new CfnManagedLoginBranding(this, 'ManagedLoginBranding', {
      userPoolId: this.userPool.userPoolId,
      clientId: client.userPoolClientId,
      useCognitoProvidedValues: true,
    });

    new CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: client.userPoolClientId });
    new CfnOutput(this, 'CognitoDomain', { value: domain.baseUrl() });
  }
}
