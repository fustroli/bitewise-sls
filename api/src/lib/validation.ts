import { ULID } from '@bitewise/shared';
import type { z } from 'zod';
import { badRequest } from './http';

/** Parses or throws a 400 listing every problem, like the EC2 app's ValidationPipe. */
export function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw badRequest(
    result.error.issues.flatMap((issue) => {
      const messages =
        issue.code === 'unrecognized_keys' ? issue.keys.map((key) => `property ${key} should not exist`) : [issue.message];
      // Nested fields get their parent's path, like class-validator: "mealIngredients.0.quantity must be ..."
      const parent = issue.path.slice(0, issue.code === 'unrecognized_keys' ? undefined : -1).join('.');
      return parent ? messages.map((message) => `${parent}.${message}`) : messages;
    }),
  );
}

/** A path id; the EC2 app's ParseIntPipe answered a malformed id with a 400 too. */
export function parseId(id: string | undefined): string {
  if (!id || !ULID.test(id)) throw badRequest('Validation failed (ULID is expected)');
  return id;
}
