import { Logger } from '@aws-lambda-powertools/logger';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { ddb, TABLE_NAME } from '../lib/ddb';

const logger = new Logger({ serviceName: 'post-confirmation' });

/**
 * Creates the Profile of a new User (native sign-up confirmed, or a first Google sign-in that
 * wasn't linked). Groups start missing, like an empty Profile today.
 */
export const handler: PostConfirmationTriggerHandler = async (event) => {
  // Also fires after a password reset; that User already has a Profile.
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') return event;

  const sub = event.request.userAttributes.sub;
  const now = new Date().toISOString();
  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { PK: `USER#${sub}`, SK: 'PROFILE', createdAt: now, updatedAt: now },
        // Cognito retries a failed trigger; never overwrite a Profile.
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );
    logger.info('Profile created', { sub });
  } catch (error) {
    if (!(error instanceof ConditionalCheckFailedException)) throw error;
    logger.info('Profile already exists', { sub });
  }
  return event;
};
