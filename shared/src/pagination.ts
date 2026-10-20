import { z } from 'zod';
import { MAX_IDS, MAX_PAGE_LIMIT, MAX_SEARCH_LENGTH } from './constants';
import { oneOf, ULID } from './rules';

export const ORDER_DIRECTIONS = ['asc', 'desc'] as const;
export type OrderDirection = (typeof ORDER_DIRECTIONS)[number];

// Query strings arrive as text; an empty value counts as missing.
const text = z.preprocess((value) => (value === '' ? undefined : value), z.string().optional());

function integer(field: string, min: number, max?: number) {
  return z.preprocess(
    (value) => (value === undefined || value === '' ? undefined : Number(value)),
    z
      .number()
      .int({ error: `${field} must be an integer number` })
      .min(min, { error: `${field} must not be less than ${min}` })
      .max(max ?? Number.MAX_SAFE_INTEGER, { error: `${field} must not be greater than ${max}` })
      .optional(),
  );
}

/**
 * `limit`, `offset`, `orderBy`, `orderDirection`, `search` and `ids` of a list request, as in the
 * EC2 app's PaginationDto. `ids` are comma-separated; when present, limit and offset are ignored.
 */
export function listQuerySchema<const T extends readonly [string, ...string[]]>(sortable: T) {
  return z.strictObject({
    limit: integer('limit', 1, MAX_PAGE_LIMIT),
    offset: integer('offset', 0),
    orderBy: text.pipe(z.enum(sortable, { error: `orderBy must be one of: ${sortable.join(', ')}` }).optional()),
    orderDirection: text.pipe(oneOf('orderDirection', ORDER_DIRECTIONS).optional()),
    search: text.pipe(
      z
        .string()
        .trim()
        .max(MAX_SEARCH_LENGTH, { error: `search must be shorter than or equal to ${MAX_SEARCH_LENGTH} characters` })
        .optional(),
    ),
    ids: text.pipe(
      z
        .string()
        .transform((value) => value.split(',').map((id) => id.trim()))
        .pipe(
          z
            .array(z.string())
            .refine((ids) => ids.every((id) => ULID.test(id)), { error: 'each value in ids must be a ULID' })
            .min(1, { error: 'ids must contain at least 1 elements' })
            .max(MAX_IDS, { error: `ids must contain no more than ${MAX_IDS} elements` }),
        )
        .optional(),
    ),
  });
}
export type ListQuery<T extends readonly [string, ...string[]]> = z.infer<ReturnType<typeof listQuerySchema<T>>>;
