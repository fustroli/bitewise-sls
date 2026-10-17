import { beforeEach, describe, expect, test } from 'bun:test';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { Context, PostConfirmationTriggerEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';

process.env.TABLE_NAME = 'bitewise-sls';
const ddb = mockClient(DynamoDBDocumentClient);
const { handler } = await import('./post-confirmation');

function event(triggerSource: PostConfirmationTriggerEvent['triggerSource']): PostConfirmationTriggerEvent {
  return {
    triggerSource,
    request: { userAttributes: { sub: 'abc-123', email: 'a@example.com' } },
    response: {},
  } as unknown as PostConfirmationTriggerEvent;
}

const run = (e: PostConfirmationTriggerEvent) => handler(e, {} as Context, () => {});

describe('post-confirmation', () => {
  beforeEach(() => ddb.reset());

  test('creates the Profile without overwriting', async () => {
    ddb.on(PutCommand).resolves({});
    await run(event('PostConfirmation_ConfirmSignUp'));

    const [call] = ddb.commandCalls(PutCommand);
    const input = call!.args[0].input;
    expect(input.TableName).toBe('bitewise-sls');
    expect(input.Item).toMatchObject({ PK: 'USER#abc-123', SK: 'PROFILE' });
    expect(input.ConditionExpression).toBe('attribute_not_exists(PK)');
  });

  test('ignores password reset confirmations', async () => {
    await run(event('PostConfirmation_ConfirmForgotPassword'));
    expect(ddb.commandCalls(PutCommand)).toHaveLength(0);
  });

  test('an existing Profile is fine (retried trigger)', async () => {
    ddb.on(PutCommand).rejects(new ConditionalCheckFailedException({ message: 'exists', $metadata: {} }));
    await expect(run(event('PostConfirmation_ConfirmSignUp'))).resolves.toBeDefined();
  });

  test('other errors fail the trigger', async () => {
    ddb.on(PutCommand).rejects(new Error('throttled'));
    await expect(run(event('PostConfirmation_ConfirmSignUp'))).rejects.toThrow('throttled');
  });
});
