import { describe, expect, test } from 'bun:test';
import type { Context, CustomMessageTriggerEvent } from 'aws-lambda';

process.env.APP_URL = 'https://sls.bitewise.rolandfuest.com';
const { handler } = await import('./custom-message');

function event(triggerSource: CustomMessageTriggerEvent['triggerSource']): CustomMessageTriggerEvent {
  return {
    triggerSource,
    request: { codeParameter: '{####}', usernameParameter: null, userAttributes: {}, linkParameter: '' },
    response: { smsMessage: null, emailMessage: null, emailSubject: null },
  } as unknown as CustomMessageTriggerEvent;
}

async function run(e: CustomMessageTriggerEvent) {
  return (await handler(e, {} as Context, () => {})) as CustomMessageTriggerEvent;
}

describe('custom-message', () => {
  test('sign-up gets the branded verify email with the code placeholder', async () => {
    const { response } = await run(event('CustomMessage_SignUp'));
    expect(response.emailSubject).toBe('Verify your BiteWise email');
    expect(response.emailMessage).toContain('{####}');
    expect(response.emailMessage).toContain('Confirm your email');
    expect(response.emailMessage).toContain('BiteWise · sls.bitewise.rolandfuest.com');
  });

  test.each([
    ['CustomMessage_ResendCode', 'Verify your BiteWise email'],
    ['CustomMessage_ForgotPassword', 'Reset your BiteWise password'],
    ['CustomMessage_UpdateUserAttribute', 'Confirm your new BiteWise email'],
    ['CustomMessage_VerifyUserAttribute', 'Confirm your new BiteWise email'],
  ] as const)('%s → %s', async (source, subject) => {
    const { response } = await run(event(source));
    expect(response.emailSubject).toBe(subject);
    expect(response.emailMessage).toContain('{####}');
  });

  test('stays under the 20,000 character limit', async () => {
    const { response } = await run(event('CustomMessage_ForgotPassword'));
    expect(response.emailMessage!.length).toBeLessThan(20_000);
  });

  test('escapes text but not the code', async () => {
    const { response } = await run(event('CustomMessage_SignUp'));
    expect(response.emailMessage).toContain('aren&#39;t read');
  });

  test('other messages keep the Cognito default', async () => {
    const { response } = await run(event('CustomMessage_AdminCreateUser'));
    expect(response.emailMessage).toBeNull();
    expect(response.emailSubject).toBeNull();
  });
});
