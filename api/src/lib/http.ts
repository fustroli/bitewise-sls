import type { Logger } from '@aws-lambda-powertools/logger';
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

export type ApiEvent = APIGatewayProxyEventV2WithJWTAuthorizer;
export type ApiResult = APIGatewayProxyStructuredResultV2;

const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
  409: 'Conflict',
};

/** An error with a status and the message(s) the client sees, like a NestJS HttpException. */
export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly messages: string | string[],
  ) {
    super(Array.isArray(messages) ? messages.join('; ') : messages);
  }
}

export const badRequest = (messages: string | string[]) => new HttpError(400, messages);
export const notFound = (message: string) => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);

export function json(statusCode: number, body: unknown): ApiResult {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}

export function noContent(): ApiResult {
  return { statusCode: 204 };
}

/** Same body as the EC2 app (NestJS): `{ statusCode, message, error }`; anything unexpected is a 500. */
export function errorResult(error: unknown, logger: Logger): ApiResult {
  if (error instanceof HttpError) {
    const { statusCode, messages } = error;
    return json(statusCode, { statusCode, message: messages, error: STATUS_TEXT[statusCode] });
  }
  logger.error('Unhandled error', error as Error);
  return json(500, { statusCode: 500, message: 'Internal server error' });
}

/** The Owner: the JWT `sub`, checked by the API Gateway authorizer. Never taken from the request. */
export function ownerOf(event: ApiEvent): string {
  const sub = event.requestContext.authorizer?.jwt?.claims?.sub;
  if (typeof sub !== 'string') throw new Error('No sub claim: is the JWT authorizer attached to this route?');
  return sub;
}

export function jsonBody(event: ApiEvent): unknown {
  if (!event.body) return {};
  const text = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  try {
    return JSON.parse(text);
  } catch (error) {
    throw badRequest((error as Error).message);
  }
}
