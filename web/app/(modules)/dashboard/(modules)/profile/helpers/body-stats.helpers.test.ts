import {
  EActivityLevel,
  ESex,
} from '@/app/(modules)/dashboard/(modules)/_user/enums';
import {
  TBodyStatsSchema,
  createBodyStatsSchema,
} from '@/app/(modules)/dashboard/(modules)/profile/validations';
import { describe, expect, it } from 'vitest';
import { toBodyStatsChange, toBodyStatsFormValues } from './body-stats.helpers';

import { IUser } from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { copy as en } from '@/app/copy';

const schema = createBodyStatsSchema(en);

const VALID: TBodyStatsSchema = {
  sex: ESex.FEMALE,
  heightCm: 170,
  weightKg: 62.5,
  neckCm: 32,
  waistCm: 70.5,
  hipCm: 96,
  activityLevel: EActivityLevel.LIGHT,
};

const USER: IUser = { id: 'user-sub', email: 'a@b.c', bodyStats: VALID };

const errorFor = (values: Partial<TBodyStatsSchema>) => {
  const result = schema.safeParse({ ...VALID, ...values });
  return result.success ? undefined : result.error.issues[0].message;
};

describe('Body stats validation', () => {
  it('accepts valid Body stats', () => {
    expect(errorFor({})).toBeUndefined();
  });

  it('accepts every field unset', () => {
    expect(
      errorFor({
        sex: null,
        heightCm: null,
        weightKg: null,
        neckCm: null,
        waistCm: null,
        hipCm: null,
        activityLevel: null,
      }),
    ).toBeUndefined();
  });

  it.each([100, 250])('accepts a height of %s cm', (heightCm) => {
    expect(errorFor({ heightCm })).toBeUndefined();
  });

  it.each([99, 251])('rejects a height of %s cm', (heightCm) => {
    expect(errorFor({ heightCm })).toBe(
      'Height must be between 100 and 250 cm',
    );
  });

  it('rejects a height with decimals', () => {
    expect(errorFor({ heightCm: 170.5 })).toBe(en.validation.wholeNumber);
  });

  it.each([30, 300, 72.3])('accepts a weight of %s kg', (weightKg) => {
    expect(errorFor({ weightKg })).toBeUndefined();
  });

  it.each([29.9, 300.1])('rejects a weight of %s kg', (weightKg) => {
    expect(errorFor({ weightKg })).toBe('Weight must be between 30 and 300 kg');
  });

  it('rejects a weight with two decimals', () => {
    expect(errorFor({ weightKg: 72.35 })).toBe(en.validation.oneDecimal);
  });

  it.each([
    ['neckCm', 20, 60, 'Neck must be between 20 and 60 cm'],
    ['waistCm', 40, 200, 'Waist must be between 40 and 200 cm'],
    ['hipCm', 50, 200, 'Hip must be between 50 and 200 cm'],
  ] as const)('limits %s to %s–%s cm', (field, min, max, message) => {
    const neckCm = field === 'neckCm' ? null : VALID.neckCm;
    expect(errorFor({ neckCm, [field]: min })).toBeUndefined();
    expect(errorFor({ neckCm, [field]: max })).toBeUndefined();
    expect(errorFor({ neckCm, [field]: min - 0.5 })).toBe(message);
    expect(errorFor({ neckCm, [field]: max + 0.5 })).toBe(message);
  });

  it.each(['neckCm', 'waistCm', 'hipCm'] as const)(
    'rejects %s off the 0.5 step',
    (field) => {
      expect(errorFor({ [field]: 55.5 })).toBeUndefined();
      expect(errorFor({ [field]: 55.3 })).toBe(en.validation.halfStep);
    },
  );

  it.each([50, 49.5])(
    'rejects a waist of %s cm not above a 50 cm neck',
    (waistCm) => {
      const result = schema.safeParse({ ...VALID, neckCm: 50, waistCm });
      expect(result.success).toBe(false);
      expect(result.error!.issues).toEqual([
        expect.objectContaining({
          path: ['waistCm'],
          message: en.validation.waistAboveNeck,
        }),
      ]);
    },
  );

  it.each([
    { neckCm: null, waistCm: 40 },
    { neckCm: 60, waistCm: null },
  ])('compares waist and neck only when both are set: %o', (values) => {
    expect(errorFor(values)).toBeUndefined();
  });
});

describe('Body stats change', () => {
  it('starts every unset field as null', () => {
    expect(toBodyStatsFormValues({ id: 'user-sub', email: 'a@b.c' })).toEqual({
      sex: null,
      heightCm: null,
      weightKg: null,
      neckCm: null,
      waistCm: null,
      hipCm: null,
      activityLevel: null,
    });
  });

  it('contains only the fields that changed', () => {
    expect(toBodyStatsChange({ ...VALID, weightKg: 61 }, USER)).toEqual({
      bodyStats: { weightKg: 61 },
    });
  });

  it('sends an emptied field as null', () => {
    expect(toBodyStatsChange({ ...VALID, heightCm: null }, USER)).toEqual({
      bodyStats: { heightCm: null },
    });
  });

  it('sends changed and emptied measurements', () => {
    expect(
      toBodyStatsChange({ ...VALID, waistCm: 72, hipCm: null }, USER),
    ).toEqual({ bodyStats: { waistCm: 72, hipCm: null } });
  });

  it('sends nothing when nothing changed', () => {
    expect(toBodyStatsChange(toBodyStatsFormValues(USER), USER)).toEqual({
      bodyStats: {},
    });
  });
});
