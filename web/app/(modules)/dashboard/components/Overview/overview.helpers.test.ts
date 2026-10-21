import {
  GOAL_TICK_PERCENT,
  bodyFatTicks,
  bodyFatZones,
  goalBarPercent,
  setupProgress,
} from '@/app/(modules)/dashboard/components/Overview/overview.helpers';
import { describe, expect, it } from 'vitest';

import { ESex } from '@/app/(modules)/dashboard/(modules)/_user/enums';

describe('setupProgress', () => {
  it('has nothing done without Body stats', () => {
    expect(setupProgress(undefined, undefined)).toEqual({
      bodyStats: false,
      activity: false,
      measurements: false,
    });
  });

  it('needs the hip for a woman only', () => {
    const stats = { sex: ESex.FEMALE, neckCm: 32, waistCm: 72, hipCm: null };

    expect(setupProgress(stats, undefined).measurements).toBe(false);
    expect(
      setupProgress({ ...stats, sex: ESex.MALE }, undefined).measurements,
    ).toBe(true);
  });

  it('needs the date of birth for the activity step', () => {
    const stats = { activityLevel: null };

    expect(setupProgress(stats, '1990-01-01').activity).toBe(false);
  });
});

describe('body fat scale', () => {
  it('cuts the open ends to the scale', () => {
    const zones = bodyFatZones(ESex.MALE);

    expect(zones[0]).toMatchObject({ from: 2, to: 6 });
    expect(zones.at(-1)).toMatchObject({ from: 25, to: 35 });
  });

  it('ticks the band boundaries', () => {
    expect(bodyFatTicks(ESex.FEMALE)).toEqual([14, 21, 25, 32]);
  });
});

describe('goalBarPercent', () => {
  it('ticks Maintenance at two thirds', () => {
    expect(GOAL_TICK_PERCENT).toBeCloseTo(66.67, 1);
  });

  it('caps at a full bar', () => {
    expect(goalBarPercent(180)).toBe(100);
  });
});
