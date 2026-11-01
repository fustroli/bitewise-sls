import { TApiResult } from '@/app/utils/interfaces';
import { ULID } from '@bitewise/shared';
import { z } from 'zod';

const HTTP_BAD_REQUEST = 400;

/**
 * Checks a request body with the API's own schema before sending it, so a
 * bad one comes back as the API's 400 would, without the round trip.
 */
export function parseInput<T extends z.ZodType>(
  schema: T,
  value: unknown,
): TApiResult<z.output<T>> {
  const result = schema.safeParse(value);
  return result.success
    ? { ok: true, data: result.data }
    : {
        ok: false,
        status: HTTP_BAD_REQUEST,
        message: result.error.issues.map((issue) => issue.message).join(', '),
      };
}

/** An Owned resource's id; anything else never reaches a URL path. */
export const idSchema = z.string().regex(ULID, { error: 'Invalid id' });
