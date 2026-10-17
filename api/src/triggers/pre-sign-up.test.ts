import { beforeEach, describe, expect, test } from 'bun:test';
import {
  AdminDeleteUserCommand,
  AdminLinkProviderForUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  type UserType,
} from '@aws-sdk/client-cognito-identity-provider';
import type { Context, PreSignUpTriggerEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';

const cognito = mockClient(CognitoIdentityProviderClient);
const { handler } = await import('./pre-sign-up');

const POOL = 'us-east-1_test';

function event(
  triggerSource: PreSignUpTriggerEvent['triggerSource'],
  userName: string,
  attributes: Record<string, string>,
): PreSignUpTriggerEvent {
  return {
    triggerSource,
    userPoolId: POOL,
    userName,
    request: { userAttributes: attributes },
    response: { autoConfirmUser: false, autoVerifyEmail: false, autoVerifyPhone: false },
  } as unknown as PreSignUpTriggerEvent;
}

const google = (emailVerified = 'true') =>
  event('PreSignUp_ExternalProvider', 'google_1098', { email: 'Ann@Example.com', email_verified: emailVerified });
const native = () => event('PreSignUp_SignUp', 'ann@example.com', { email: 'ann@example.com' });

const user = (Username: string, UserStatus: UserType['UserStatus']): UserType => ({ Username, UserStatus });
const run = (e: PreSignUpTriggerEvent) => handler(e, {} as Context, () => {});

describe('pre-sign-up', () => {
  beforeEach(() => cognito.reset());

  describe('Google sign-in', () => {
    test('links to the confirmed native user with the same email', async () => {
      cognito.on(ListUsersCommand).resolves({ Users: [user('native-uuid', 'CONFIRMED')] });
      await run(google());

      expect(cognito.commandCalls(ListUsersCommand)[0]!.args[0].input.Filter).toBe('email = "ann@example.com"');
      expect(cognito.commandCalls(AdminLinkProviderForUserCommand)[0]!.args[0].input).toEqual({
        UserPoolId: POOL,
        DestinationUser: { ProviderName: 'Cognito', ProviderAttributeValue: 'native-uuid' },
        SourceUser: { ProviderName: 'Google', ProviderAttributeName: 'Cognito_Subject', ProviderAttributeValue: '1098' },
      });
    });

    test('never links on an unverified provider email', async () => {
      await run(google('false'));
      expect(cognito.calls()).toHaveLength(0);
    });

    test('replaces an unconfirmed native user instead of linking', async () => {
      cognito.on(ListUsersCommand).resolves({ Users: [user('native-uuid', 'UNCONFIRMED')] });
      await run(google());

      expect(cognito.commandCalls(AdminDeleteUserCommand)[0]!.args[0].input).toEqual({
        UserPoolId: POOL,
        Username: 'native-uuid',
      });
      expect(cognito.commandCalls(AdminLinkProviderForUserCommand)).toHaveLength(0);
    });

    test('no native user: the Google user is created as is', async () => {
      cognito.on(ListUsersCommand).resolves({ Users: [] });
      await expect(run(google())).resolves.toBeDefined();
      expect(cognito.commandCalls(AdminLinkProviderForUserCommand)).toHaveLength(0);
    });
  });

  describe('native sign-up', () => {
    test('rejected when a Google-only user has the email', async () => {
      cognito.on(ListUsersCommand).resolves({ Users: [user('google_1098', 'EXTERNAL_PROVIDER')] });
      await expect(run(native())).rejects.toThrow('Email already in use.');
    });

    test('allowed otherwise', async () => {
      cognito.on(ListUsersCommand).resolves({ Users: [] });
      await expect(run(native())).resolves.toBeDefined();
    });
  });

  test('quotes in the email cannot break the filter', async () => {
    cognito.on(ListUsersCommand).resolves({ Users: [] });
    await run(event('PreSignUp_SignUp', 'x', { email: 'a"b@example.com' }));
    expect(cognito.commandCalls(ListUsersCommand)[0]!.args[0].input.Filter).toBe('email = "a\\"b@example.com"');
  });
});
