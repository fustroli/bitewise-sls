import {
  ECalorieTarget,
  EMacroPlan,
} from '@/app/(modules)/dashboard/(modules)/_user/enums';
import { describe, expect, it } from 'vitest';

import { parseTargets } from '@/app/(modules)/dashboard/(modules)/_body-metrics/hooks';

describe('parseTargets', () => {
  it('reads the stored picks', () => {
    expect(
      parseTargets({
        calorieTarget: ECalorieTarget.GAIN_MILD,
        macroPlan: EMacroPlan.LOW_CARB,
      }),
    ).toEqual({
      calorieTarget: ECalorieTarget.GAIN_MILD,
      macroPlan: EMacroPlan.LOW_CARB,
    });
  });

  it.each([undefined, {}, { calorieTarget: null, macroPlan: null }])(
    'falls back to Maintenance and Balanced for %j',
    (targets) => {
      expect(parseTargets(targets)).toEqual({
        calorieTarget: ECalorieTarget.MAINTENANCE,
        macroPlan: EMacroPlan.BALANCED,
      });
    },
  );

  it('falls back for unknown values', () => {
    expect(
      parseTargets({ calorieTarget: 'bulk', macroPlan: 'keto' } as any),
    ).toEqual({
      calorieTarget: ECalorieTarget.MAINTENANCE,
      macroPlan: EMacroPlan.BALANCED,
    });
  });
});
