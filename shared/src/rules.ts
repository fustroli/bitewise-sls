import { z } from 'zod';
import { MAX_LENGTH, MIN_LENGTH } from './constants';

// Field builders whose messages match class-validator's defaults, so the API keeps the EC2 app's
// error messages ("protein must not be less than 0").

export function name() {
  return z
    .string({ error: (issue) => (issue.input === undefined ? 'name should not be empty' : 'name must be a string') })
    .min(MIN_LENGTH, { error: `Name must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters` })
    .max(MAX_LENGTH, { error: `Name must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters` });
}

export function number(field: string, min: number, max: number) {
  return z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? `${field} should not be empty`
          : `${field} must be a number conforming to the specified constraints`,
    })
    .min(min, { error: `${field} must not be less than ${min}` })
    .max(max, { error: `${field} must not be greater than ${max}` });
}

export function positive(field: string, max: number) {
  return z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? `${field} should not be empty`
          : `${field} must be a number conforming to the specified constraints`,
    })
    .positive({ error: `${field} must be a positive number` })
    .max(max, { error: `${field} must not be greater than ${max}` });
}

/** An id of another Owned resource. */
export function id(field: string) {
  return z.string({ error: `${field} must be a ULID` }).regex(ULID, { error: `${field} must be a ULID` });
}

export function oneOf<const T extends readonly [string, ...string[]]>(field: string, values: T) {
  return z.enum(values, { error: `${field} must be one of the following values: ${values.join(', ')}` });
}

// Crockford base32, 26 chars
export const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;
