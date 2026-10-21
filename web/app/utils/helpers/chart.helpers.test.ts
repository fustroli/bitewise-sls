import { describe, expect, it } from 'vitest';
import {
  macroEnergyShares,
  progressPercent,
  scalePosition,
} from '@/app/utils/helpers/chart.helpers';

describe('macroEnergyShares', () => {
  it('splits by energy, fat counting 9 kcal per gram', () => {
    const shares = macroEnergyShares({ protein: 10, carbs: 10, fat: 10 });

    expect(shares.protein).toBeCloseTo(40 / 170);
    expect(shares.carbs).toBeCloseTo(40 / 170);
    expect(shares.fat).toBeCloseTo(90 / 170);
    expect(shares.protein + shares.carbs + shares.fat).toBeCloseTo(1);
  });

  it('gives a pure macro the whole bar', () => {
    expect(macroEnergyShares({ protein: 0, carbs: 0, fat: 100 })).toEqual({
      protein: 0,
      carbs: 0,
      fat: 1,
    });
  });

  it('is all zeros without energy', () => {
    expect(macroEnergyShares({ protein: 0, carbs: 0, fat: 0 })).toEqual({
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it('ignores negative grams', () => {
    expect(macroEnergyShares({ protein: -5, carbs: 10, fat: 0 }).carbs).toBe(1);
  });
});

describe('scalePosition', () => {
  it('places a value linearly', () => {
    expect(scalePosition(25, 15, 40)).toBeCloseTo(40);
  });

  it.each([
    [10, 0],
    [50, 100],
  ])('clamps %d to %d%%', (value, position) => {
    expect(scalePosition(value, 15, 40)).toBe(position);
  });

  it('is 0 for an empty range', () => {
    expect(scalePosition(5, 10, 10)).toBe(0);
  });
});

describe('progressPercent', () => {
  it('caps at 100%', () => {
    expect(progressPercent(3000, 2000)).toBe(100);
    expect(progressPercent(1000, 2000)).toBe(50);
  });

  it('is 0 without a target', () => {
    expect(progressPercent(100, 0)).toBe(0);
  });
});
