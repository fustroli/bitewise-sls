import { describe, expect, it } from 'vitest';

import { pluralize } from '@/app/utils/helpers';

const FORMS = { one: '{count} meal', other: '{count} meals' };

describe('pluralize', () => {
  it.each([
    [1, 'en', '1 meal'],
    [3, 'en', '3 meals'],
    [1.5, 'en', '1.5 meals'],
    [0, 'en', '0 meals'],
  ])('picks the form for %d in %s', (count, locale, text) => {
    expect(pluralize(count, FORMS, locale)).toBe(text);
  });
});
