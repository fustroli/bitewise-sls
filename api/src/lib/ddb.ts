import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { requireEnv } from './env';

export const TABLE_NAME = requireEnv('TABLE_NAME');

// Module scope: reused across warm invocations
export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
