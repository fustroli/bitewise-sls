import { Logger } from '@aws-lambda-powertools/logger';
import {
  AdminDeleteUserCommand,
  AdminLinkProviderForUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  type UserType,
} from '@aws-sdk/client-cognito-identity-provider';
import type { PreSignUpTriggerEvent, PreSignUpTriggerHandler } from 'aws-lambda';

const logger = new Logger({ serviceName: 'pre-sign-up' });
// Module scope: reused across warm invocations
const cognito = new CognitoIdentityProviderClient({});

// Cognito names federated users `<provider, lowercased>_<provider's subject>`
const PROVIDERS: Record<string, string> = { google: 'Google' };

/**
 * Keeps one User per email across native and Google sign-in:
 * - a first Google sign-in with a Google-verified email joins the native User with that email;
 * - a native sign-up is rejected when a Google-only User already has the email.
 */
export const handler: PreSignUpTriggerHandler = async (event) => {
  const email = event.request.userAttributes.email?.toLowerCase();
  if (!email) return event;

  if (event.triggerSource === 'PreSignUp_ExternalProvider') {
    await linkToNativeUser(event, email);
  } else if (event.triggerSource === 'PreSignUp_SignUp') {
    const users = await usersWithEmail(event.userPoolId, email);
    // Message from bitewise-backend; Cognito prefixes it with "PreSignUp failed with error".
    if (users.some((user) => user.UserStatus === 'EXTERNAL_PROVIDER')) throw new Error('Email already in use.');
  }
  return event;
};

async function linkToNativeUser(event: PreSignUpTriggerEvent, email: string): Promise<void> {
  const [prefix = '', ...rest] = event.userName.split('_');
  const providerName = PROVIDERS[prefix];
  if (!providerName) {
    logger.warn('Unknown external provider, not linking', { userName: event.userName });
    return;
  }
  // An unverified email proves nothing; linking on it would hand over the account.
  if (event.request.userAttributes.email_verified !== 'true') {
    logger.info('Provider email not verified, not linking', { userName: event.userName });
    return;
  }

  const users = await usersWithEmail(event.userPoolId, email);
  const native = users.find((user) => user.UserStatus !== 'EXTERNAL_PROVIDER');
  if (!native?.Username) return;

  if (native.UserStatus === 'UNCONFIRMED') {
    // Whoever set that password never proved they own the email (CONTEXT.md, Email
    // verification); drop it and let the Google User be created instead.
    await cognito.send(new AdminDeleteUserCommand({ UserPoolId: event.userPoolId, Username: native.Username }));
    logger.info('Deleted unconfirmed native user in favour of the provider identity', { userName: event.userName });
    return;
  }

  await cognito.send(
    new AdminLinkProviderForUserCommand({
      UserPoolId: event.userPoolId,
      DestinationUser: { ProviderName: 'Cognito', ProviderAttributeValue: native.Username },
      SourceUser: {
        ProviderName: providerName,
        ProviderAttributeName: 'Cognito_Subject',
        ProviderAttributeValue: rest.join('_'),
      },
    }),
  );
  logger.info('Linked provider identity to native user', { userName: event.userName, nativeUser: native.Username });
}

async function usersWithEmail(userPoolId: string, email: string): Promise<UserType[]> {
  const value = email.replace(/[\\"]/g, '\\$&');
  const { Users = [] } = await cognito.send(new ListUsersCommand({ UserPoolId: userPoolId, Filter: `email = "${value}"` }));
  return Users;
}
