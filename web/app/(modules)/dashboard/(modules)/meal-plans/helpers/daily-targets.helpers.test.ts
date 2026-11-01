import {
  EActivityLevel,
  ECalorieTarget,
  EMacroPlan,
  ESex,
} from '@/app/(modules)/dashboard/(modules)/_user/enums';
import {
  calorieGap,
  dailyTargets,
} from '@/app/(modules)/dashboard/(modules)/meal-plans/helpers';
import { describe, expect, it } from 'vitest';

import { bodyMetrics } from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';

/** calculator.net's macro example: 2,615 kcal, Balanced plan. */
const metricsAt = (calorieTarget?: ECalorieTarget) =>
  bodyMetrics({
    bodyStats: {
      sex: ESex.MALE,
      heightCm: 177.8,
      weightKg: 79.3787,
      activityLevel: EActivityLevel.MODERATE,
    },
    dateOfBirth: '2000-01-15T12:00:00.000Z',
    calorieTarget,
    today: new Date(2025, 5, 1),
  });
const metrics = metricsAt();

describe('dailyTargets', () => {
  it('takes calories from Maintenance and macros from the Balanced plan', () => {
    const targets = dailyTargets(metrics)!;

    expect(targets.target.target).toBe(ECalorieTarget.MAINTENANCE);
    expect(targets.plan).toBe(EMacroPlan.BALANCED);
    expect(Math.round(targets.calories)).toBe(2615);
    expect(Math.round(targets.protein)).toBe(159);
    expect(Math.round(targets.totalFat)).toBe(74);
    expect(Math.round(targets.totalCarbohydrates)).toBe(349);
    expect(Math.round(targets.sugar)).toBe(70);
    expect(Math.round(targets.saturatedFat)).toBe(30);
  });

  it('follows the picked plan', () => {
    const targets = dailyTargets(metrics, EMacroPlan.HIGH_PROTEIN)!;

    expect(targets.plan).toBe(EMacroPlan.HIGH_PROTEIN);
    expect(Math.round(targets.protein)).toBe(223);
    expect(Math.round(targets.calories)).toBe(2615);
  });

  it('follows the picked Calorie target, macros and caps included', () => {
    const targets = dailyTargets(metricsAt(ECalorieTarget.GAIN_FAST))!;

    expect(targets.target.target).toBe(ECalorieTarget.GAIN_FAST);
    expect(Math.round(targets.calories)).toBe(3615);
    expect(targets.protein).toBeCloseTo((0.25 * 3615) / 4.1, 0);
    expect(targets.sugar).toBeCloseTo((0.1 * 3615) / 3.75, 0);
    expect(targets.safeMinimum).toBe(1500);
  });

  it('is unset while targets can not be computed', () => {
    expect(dailyTargets(bodyMetrics({ today: new Date() }))).toBe(undefined);
  });
});

describe('calorieGap', () => {
  it.each([
    [2100, 2000, 100, true],
    [2150, 2000, 150, true],
    [1849, 2000, -151, false],
  ])('%d against %d is %d off', (kcal, target, diff, onTarget) => {
    expect(calorieGap(kcal, target)).toEqual({ diff, onTarget });
  });
});
