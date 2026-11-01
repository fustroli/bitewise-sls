import {
  comparisonSearch,
  formatDelta,
  parseComparisonQuery,
} from '@/app/(modules)/dashboard/(modules)/_comparison/helpers';
import { describe, expect, it } from 'vitest';

import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';

const [A, B, C, D] = [
  '01JAZ3Q8V6X2M5N7P9R1S3T5WA',
  '01JAZ3Q8V6X2M5N7P9R1S3T5WB',
  '01JAZ3Q8V6X2M5N7P9R1S3T5WC',
  '01JAZ3Q8V6X2M5N7P9R1S3T5WD',
];

describe('parseComparisonQuery', () => {
  it('reads the kind and the slots', () => {
    expect(parseComparisonQuery({ type: 'meals', ids: `${A},${B}` })).toEqual({
      kind: EComparisonKind.MEALS,
      ids: [A, B],
    });
  });

  it('keeps an empty middle slot', () => {
    expect(
      parseComparisonQuery({ type: 'plans', ids: `${A},,${C}` }).ids,
    ).toEqual([A, null, C]);
  });

  it.each([undefined, 'snacks', ['meals', 'plans']])(
    'falls back for the type %j',
    (type) => {
      const { kind } = parseComparisonQuery({ type });

      expect(kind).toBe(
        Array.isArray(type)
          ? EComparisonKind.MEALS
          : EComparisonKind.INGREDIENTS,
      );
    },
  );

  it('drops what is not an id and anything past three', () => {
    expect(
      parseComparisonQuery({ ids: `x,${A.toLowerCase()},${C},${D}` }).ids,
    ).toEqual([null, null, C]);
    expect(parseComparisonQuery({ ids: 'x,7' }).ids).toEqual([]);
    expect(parseComparisonQuery({ ids: `${A},${B},${C},${D}` }).ids).toEqual([
      A,
      B,
      C,
    ]);
  });

  it('has no slots without ids', () => {
    expect(parseComparisonQuery({}).ids).toEqual([]);
  });
});

describe('comparisonSearch', () => {
  it('writes what it reads, without trailing empty slots', () => {
    expect(
      comparisonSearch({ kind: EComparisonKind.MEALS, ids: [A, null, null] }),
    ).toBe(`?type=meals&ids=${A}`);
    expect(
      comparisonSearch({ kind: EComparisonKind.MEALS, ids: [A, null, C] }),
    ).toBe(`?type=meals&ids=${A}%2C%2C${C}`);
    expect(comparisonSearch({ kind: EComparisonKind.MEALS, ids: [] })).toBe(
      '?type=meals',
    );
  });
});

describe('formatDelta', () => {
  it.each([
    [12.34, 'g', 1, '+12.3 g'],
    [-200.4, 'kcal', 0, '−200 kcal'],
    [1500, 'kcal', 0, '+1,500 kcal'],
    [0.04, 'g', 1, 'same'],
    [-0.2, 'kcal', 0, 'same'],
  ])('formats %d %s', (diff, unit, decimals, text) => {
    expect(formatDelta(diff, unit, decimals, 'en', 'same')).toBe(text);
  });
});
