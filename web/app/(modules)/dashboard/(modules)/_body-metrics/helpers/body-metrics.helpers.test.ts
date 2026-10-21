import {
  EActivityLevel,
  ECalorieTarget,
  EMacroPlan,
  ESex,
} from '@/app/(modules)/dashboard/(modules)/_user/enums';
import {
  EBmiCategory,
  EBodyFatCategory,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/enums';
import {
  ageOn,
  bodyMetrics,
  calorieTargetName,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';
import { describe, expect, it } from 'vitest';

import { IBodyStats } from '@/app/(modules)/dashboard/(modules)/_user/interfaces';

const TODAY = new Date(2025, 5, 1);
/** 25 years old on TODAY. */
const DOB_25 = '2000-01-15T12:00:00.000Z';

/** calculator.net's example: BMR 1,720 kcal. */
const MAN: IBodyStats = {
  sex: ESex.MALE,
  heightCm: 180,
  weightKg: 71.5,
  neckCm: 38,
  waistCm: 85,
  hipCm: null,
  activityLevel: EActivityLevel.MODERATE,
};

/** calculator.net's body fat examples (US Navy, metric). */
const NAVY_MAN: Partial<IBodyStats> = {
  sex: ESex.MALE,
  heightCm: 178,
  weightKg: 70,
  neckCm: 50,
  waistCm: 96,
};
const NAVY_WOMAN: Partial<IBodyStats> = {
  sex: ESex.FEMALE,
  heightCm: 165,
  weightKg: 60,
  neckCm: 32,
  waistCm: 72,
  hipCm: 96,
};

const metrics = (bodyStats: Partial<IBodyStats>, dateOfBirth = DOB_25) =>
  bodyMetrics({ bodyStats, dateOfBirth, today: TODAY });

const bodyFat = (bodyStats: Partial<IBodyStats>) =>
  bodyMetrics({ bodyStats, today: TODAY }).bodyFat;

/**
 * The man's neck at which the US Navy formula gives `percent`, at 100 cm
 * tall and a 100 cm waist.
 */
const manNeckFor = (percent: number) =>
  100 - 10 ** ((1.0324 + 0.15456 * 2 - 495 / (percent + 450)) / 0.19077);

/** The woman's neck for `percent`, at 100 cm tall, waist 100 and hip 100. */
const womanNeckFor = (percent: number) =>
  200 - 10 ** ((1.29579 + 0.221 * 2 - 495 / (percent + 450)) / 0.35004);

const calories = (bodyStats: Partial<IBodyStats>, dateOfBirth = DOB_25) =>
  metrics(bodyStats, dateOfBirth).calories!;

describe('Maintenance calories and Calorie targets', () => {
  it('reproduces calculator.net within 1 kcal', () => {
    const result = calories(MAN);

    expect(Math.abs(result.maintenance - 2520)).toBeLessThanOrEqual(1);
    result.lose.forEach((target, i) =>
      expect(
        Math.abs(target.kcalPerDay - [2270, 2020, 1520][i]),
      ).toBeLessThanOrEqual(1),
    );
    expect(result.lose.map((t) => Math.round(t.percentOfMaintenance))).toEqual([
      90, 80, 60,
    ]);
    expect(result.lose.map((t) => t.kgPerWeek)).toEqual([-0.25, -0.5, -1]);
  });

  it('uses the female formula', () => {
    // 10·60 + 6.25·165 − 5·25 − 161 = 1,345.25
    expect(
      calories({
        sex: ESex.FEMALE,
        heightCm: 165,
        weightKg: 60,
        activityLevel: EActivityLevel.SEDENTARY,
      }).maintenance,
    ).toBeCloseTo(1345.25 * 1.2);
  });

  it.each([
    [EActivityLevel.SEDENTARY, 1.2],
    [EActivityLevel.LIGHT, 1.375],
    [EActivityLevel.MODERATE, 1.465],
    [EActivityLevel.ACTIVE, 1.55],
    [EActivityLevel.VERY_ACTIVE, 1.725],
    [EActivityLevel.EXTRA_ACTIVE, 1.9],
  ])('multiplies BMR by the %s multiplier', (activityLevel, multiplier) => {
    expect(calories({ ...MAN, activityLevel }).maintenance).toBeCloseTo(
      1720 * multiplier,
    );
  });

  it('adds 250, 500 and 1,000 kcal to gain', () => {
    const result = calories(MAN);

    expect(result.gain.map((t) => t.kcalPerDay - result.maintenance)).toEqual([
      expect.closeTo(250),
      expect.closeTo(500),
      expect.closeTo(1000),
    ]);
    expect(result.gain.map((t) => t.kgPerWeek)).toEqual([0.25, 0.5, 1]);
    expect(result.gain.map((t) => Math.round(t.percentOfMaintenance))).toEqual([
      110, 120, 140,
    ]);
  });

  it('flags targets below 1,500 kcal for a man', () => {
    // Maintenance 2,064 kcal.
    const result = calories({
      ...MAN,
      activityLevel: EActivityLevel.SEDENTARY,
    });

    expect(result.safeMinimum).toBe(1500);
    expect(result.lose.map((t) => t.belowSafeMinimum)).toEqual([
      false,
      false,
      true,
    ]);
  });

  it('flags targets below 1,200 kcal for a woman', () => {
    // Maintenance 1,614.3 kcal.
    const result = calories({
      sex: ESex.FEMALE,
      heightCm: 165,
      weightKg: 60,
      activityLevel: EActivityLevel.SEDENTARY,
    });

    expect(result.safeMinimum).toBe(1200);
    expect(result.lose.map((t) => t.belowSafeMinimum)).toEqual([
      false,
      true,
      true,
    ]);
    expect(result.gain.some((t) => t.belowSafeMinimum)).toBe(false);
  });

  it('ages a year on the birthday', () => {
    const dateOfBirth = '1990-05-15T12:00:00.000Z';
    const on = (today: Date) =>
      bodyMetrics({ bodyStats: MAN, dateOfBirth, today }).calories!.maintenance;

    // 5 kcal less BMR per year of age.
    expect(on(new Date(2025, 4, 14)) - on(new Date(2025, 4, 15))).toBeCloseTo(
      5 * 1.465,
    );
  });
});

describe('the picked Calorie target', () => {
  const picked = (calorieTarget?: ECalorieTarget | null) =>
    bodyMetrics({
      bodyStats: MAN,
      dateOfBirth: DOB_25,
      calorieTarget,
      today: TODAY,
    }).calories!;

  it('is Maintenance, with no offset, when none is picked', () => {
    const result = picked();

    expect(result.target).toBe(result.maintenanceTarget);
    expect(result.target).toEqual({
      target: ECalorieTarget.MAINTENANCE,
      kgPerWeek: 0,
      kcalPerDay: result.maintenance,
      percentOfMaintenance: 100,
      belowSafeMinimum: false,
    });
    expect(picked(null).target.target).toBe(ECalorieTarget.MAINTENANCE);
  });

  it.each([
    [ECalorieTarget.LOSE_MILD, -0.25, -250],
    [ECalorieTarget.LOSE_NORMAL, -0.5, -500],
    [ECalorieTarget.LOSE_FAST, -1, -1000],
    [ECalorieTarget.GAIN_MILD, 0.25, 250],
    [ECalorieTarget.GAIN_NORMAL, 0.5, 500],
    [ECalorieTarget.GAIN_FAST, 1, 1000],
  ])('is %s: %d kg/week, %d kcal/day', (target, kgPerWeek, offset) => {
    const result = picked(target);

    expect(result.target.target).toBe(target);
    expect(result.target.kgPerWeek).toBe(kgPerWeek);
    expect(result.target.kcalPerDay).toBeCloseTo(result.maintenance + offset);
  });

  it('flags a picked target below the safe minimum', () => {
    const sedentary = bodyMetrics({
      bodyStats: { ...MAN, activityLevel: EActivityLevel.SEDENTARY },
      dateOfBirth: DOB_25,
      calorieTarget: ECalorieTarget.LOSE_FAST,
      today: TODAY,
    }).calories!;

    expect(sedentary.target.belowSafeMinimum).toBe(true);
  });
});

describe('calorieTargetName', () => {
  const names = {
    maintenance: 'Maintenance',
    lose: 'Lose {kg} kg/wk',
    gain: 'Gain {kg} kg/wk',
  };
  const target = (calorieTarget: ECalorieTarget) =>
    bodyMetrics({
      bodyStats: MAN,
      dateOfBirth: DOB_25,
      calorieTarget,
      today: TODAY,
    }).calories!.target;

  it.each([
    [ECalorieTarget.MAINTENANCE, 'en', 'Maintenance'],
    [ECalorieTarget.LOSE_NORMAL, 'en', 'Lose 0.5 kg/wk'],
    [ECalorieTarget.GAIN_MILD, 'en', 'Gain 0.25 kg/wk'],
    [ECalorieTarget.LOSE_MILD, 'hu', 'Lose 0,25 kg/wk'],
  ])('names %s in %s', (calorieTarget, locale, name) => {
    expect(calorieTargetName(target(calorieTarget), names, locale)).toBe(name);
  });
});

/** calculator.net's macro example: 175 lb, 5'10", 25, moderate → 2,615 kcal. */
const MACRO_MAN: IBodyStats = {
  ...MAN,
  heightCm: 177.8,
  weightKg: 79.3787,
};

describe('Macro plans', () => {
  const macros = () => metrics(MACRO_MAN).macros!;
  const plan = (name: EMacroPlan) =>
    macros().plans.find(({ plan }) => plan === name)!;

  it('lists the four plans in order', () => {
    expect(macros().plans.map(({ plan }) => plan)).toEqual([
      EMacroPlan.BALANCED,
      EMacroPlan.LOW_FAT,
      EMacroPlan.LOW_CARB,
      EMacroPlan.HIGH_PROTEIN,
    ]);
    expect(macros().kcalPerDay).toBeCloseTo(2615, 0);
  });

  it.each([
    [EMacroPlan.BALANCED, 159.45, 348.67, 74.29],
    [EMacroPlan.LOW_FAT, 175.4, 366.1, 59.43],
    [EMacroPlan.LOW_CARB, 191.34, 278.93, 89.15],
    [EMacroPlan.HIGH_PROTEIN, 223.23, 296.37, 66.86],
  ])('reproduces calculator.net for %s', (name, protein, carbs, fat) => {
    const result = plan(name);

    expect(result.protein.grams).toBeCloseTo(protein, 0);
    expect(result.carbs.grams).toBeCloseTo(carbs, 0);
    expect(result.fat.grams).toBeCloseTo(fat, 0);
  });

  it('splits the calories in full', () => {
    macros().plans.forEach(({ protein, carbs, fat }) => {
      expect(protein.kcal + carbs.kcal + fat.kcal).toBeCloseTo(2615, 0);
      expect(protein.percent + carbs.percent + fat.percent).toBeCloseTo(100);
    });
  });

  it('reproduces calculator.net ranges, which are the same for every plan', () => {
    const { protein, carbs, fat } = plan(EMacroPlan.BALANCED);

    expect([protein.minGrams, protein.maxGrams].map(Math.round)).toEqual([
      79, 223,
    ]);
    expect([carbs.minGrams, carbs.maxGrams].map(Math.round)).toEqual([
      279, 471,
    ]);
    expect([fat.minGrams, fat.maxGrams].map(Math.round)).toEqual([59, 104]);
    expect(plan(EMacroPlan.LOW_CARB).carbs.minGrams).toBe(carbs.minGrams);
  });

  it('caps sugar and saturated fat at 10% of calories', () => {
    expect(Math.round(macros().sugarMaxGrams)).toBe(70);
    expect(Math.round(macros().saturatedFatMaxGrams)).toBe(30);
  });

  it('splits the picked Calorie target, the caps scaling along', () => {
    const atTarget = bodyMetrics({
      bodyStats: MACRO_MAN,
      dateOfBirth: DOB_25,
      calorieTarget: ECalorieTarget.LOSE_NORMAL,
      today: TODAY,
    }).macros!;
    const scale = atTarget.kcalPerDay / macros().kcalPerDay;

    expect(atTarget.kcalPerDay).toBeCloseTo(2115, 0);
    expect(atTarget.plans[0].protein.grams).toBeCloseTo(
      plan(EMacroPlan.BALANCED).protein.grams * scale,
    );
    expect(atTarget.sugarMaxGrams).toBeCloseTo(macros().sugarMaxGrams * scale);
    expect(atTarget.saturatedFatMaxGrams).toBeCloseTo(
      macros().saturatedFatMaxGrams * scale,
    );
  });

  it('is unset while calories are', () => {
    expect(metrics(MACRO_MAN, '').macros).toBeUndefined();
    expect(metrics({ ...MACRO_MAN, activityLevel: null }).macros).toBe(
      undefined,
    );
  });
});

describe('ageOn', () => {
  it.each([
    [new Date(2025, 4, 14), 34],
    [new Date(2025, 4, 15), 35],
    [new Date(2025, 4, 16), 35],
  ])('is whole years as of %s', (today, age) => {
    expect(ageOn(new Date(1990, 4, 15), today)).toBe(age);
  });
});

describe('BMI', () => {
  it('is kg / m²', () => {
    expect(metrics(MAN).bmi!.value).toBeCloseTo(71.5 / 1.8 ** 2);
  });

  // At 100 cm, BMI equals the weight.
  it.each([
    [15.9, EBmiCategory.SEVERE_THINNESS],
    [16, EBmiCategory.MODERATE_THINNESS],
    [17, EBmiCategory.MILD_THINNESS],
    [18.4, EBmiCategory.MILD_THINNESS],
    [18.5, EBmiCategory.NORMAL],
    [24.9, EBmiCategory.NORMAL],
    [25, EBmiCategory.OVERWEIGHT],
    [30, EBmiCategory.OBESE_CLASS_I],
    [35, EBmiCategory.OBESE_CLASS_II],
    [39.9, EBmiCategory.OBESE_CLASS_II],
    [40, EBmiCategory.OBESE_CLASS_III],
  ])('puts a BMI of %s in %s', (weightKg, category) => {
    expect(metrics({ heightCm: 100, weightKg }).bmi!.category).toBe(category);
  });

  it('gives the healthy weight range for the height', () => {
    const { healthyWeight } = metrics(MAN).bmi!;

    expect(healthyWeight.minKg).toBeCloseTo(18.5 * 3.24);
    expect(healthyWeight.maxKg).toBeCloseTo(25 * 3.24);
  });
});

describe('Body fat percentage', () => {
  it('reproduces calculator.net for a man', () => {
    const result = bodyFat(NAVY_MAN)!;

    expect(result.percent).toBeCloseTo(15.7, 1);
    expect(result.category).toBe(EBodyFatCategory.FITNESS);
  });

  it('reproduces calculator.net for a woman', () => {
    const result = bodyFat(NAVY_WOMAN)!;

    expect(result.percent).toBeCloseTo(26.4, 1);
    expect(result.category).toBe(EBodyFatCategory.AVERAGE);
  });

  it('ignores the hip for a man', () => {
    expect(bodyFat({ ...NAVY_MAN, hipCm: 120 })!.percent).toBe(
      bodyFat(NAVY_MAN)!.percent,
    );
  });

  it('splits the weight into fat and lean mass', () => {
    const man = bodyFat(NAVY_MAN)!;
    const woman = bodyFat(NAVY_WOMAN)!;

    expect(man.fatMassKg).toBeCloseTo((70 * man.percent) / 100);
    expect(man.fatMassKg + man.leanMassKg).toBeCloseTo(70);
    // calculator.net: 11.0 / 59.0 kg and 15.8 / 44.2 kg.
    expect(man.fatMassKg).toBeCloseTo(11, 0);
    expect(woman.fatMassKg).toBeCloseTo(15.8, 1);
    expect(woman.leanMassKg).toBeCloseTo(44.2, 1);
  });

  it.each([
    [5.99, EBodyFatCategory.ESSENTIAL],
    [6.01, EBodyFatCategory.ATHLETES],
    [13.99, EBodyFatCategory.ATHLETES],
    [14.01, EBodyFatCategory.FITNESS],
    [17.99, EBodyFatCategory.FITNESS],
    [18.01, EBodyFatCategory.AVERAGE],
    [24.99, EBodyFatCategory.AVERAGE],
    [25.01, EBodyFatCategory.OBESE],
  ])('puts a man at %s%% in %s', (percent, category) => {
    const result = bodyFat({
      sex: ESex.MALE,
      heightCm: 100,
      weightKg: 70,
      neckCm: manNeckFor(percent),
      waistCm: 100,
    })!;

    expect(result.percent).toBeCloseTo(percent, 6);
    expect(result.category).toBe(category);
  });

  it.each([
    [13.99, EBodyFatCategory.ESSENTIAL],
    [14.01, EBodyFatCategory.ATHLETES],
    [20.99, EBodyFatCategory.ATHLETES],
    [21.01, EBodyFatCategory.FITNESS],
    [24.99, EBodyFatCategory.FITNESS],
    [25.01, EBodyFatCategory.AVERAGE],
    [31.99, EBodyFatCategory.AVERAGE],
    [32.01, EBodyFatCategory.OBESE],
  ])('puts a woman at %s%% in %s', (percent, category) => {
    const result = bodyFat({
      sex: ESex.FEMALE,
      heightCm: 100,
      weightKg: 60,
      neckCm: womanNeckFor(percent),
      waistCm: 100,
      hipCm: 100,
    })!;

    expect(result.percent).toBeCloseTo(percent, 6);
    expect(result.category).toBe(category);
  });

  it.each([
    ['a man with waist equal to neck', { ...NAVY_MAN, waistCm: 50 }],
    ['a man with waist below neck', { ...NAVY_MAN, waistCm: 40 }],
    [
      'a woman with waist + hip at most neck',
      { ...NAVY_WOMAN, waistCm: 40, hipCm: 50, neckCm: 90 },
    ],
    // Barely above the neck: the formula goes below 0 %.
    ['a result below 0 %', { ...NAVY_MAN, waistCm: 51 }],
    // Far above the neck: the formula goes above 75 %.
    [
      'a result above 75 %',
      { ...NAVY_MAN, heightCm: 100, neckCm: 20, waistCm: 200 },
    ],
  ])('is unset for %s', (_, bodyStats) => {
    expect(bodyFat(bodyStats)).toBeUndefined();
  });

  it('needs no date of birth', () => {
    expect(bodyFat(NAVY_MAN)).toBeDefined();
  });
});

describe('missing inputs', () => {
  it('computes nothing without Body stats', () => {
    const result = bodyMetrics({ today: TODAY });

    expect(result.bmi).toBeUndefined();
    expect(result.calories).toBeUndefined();
    expect(result.bodyFat).toBeUndefined();
    expect(result.missing).toEqual([
      'heightCm',
      'weightKg',
      'sex',
      'neckCm',
      'waistCm',
      'activityLevel',
      'dateOfBirth',
    ]);
  });

  it.each(['heightCm', 'weightKg'] as const)('needs %s for BMI', (field) => {
    const result = metrics({ ...MAN, [field]: null });

    expect(result.bmi).toBeUndefined();
    expect(result.bodyFat).toBeUndefined();
    expect(result.calories).toBeUndefined();
    expect(result.missing).toEqual([field]);
  });

  it.each(['neckCm', 'waistCm'] as const)(
    'shows BMI and calories but no body fat without %s',
    (field) => {
      const result = metrics({ ...MAN, [field]: null });

      expect(result.bmi).toBeDefined();
      expect(result.calories).toBeDefined();
      expect(result.bodyFat).toBeUndefined();
      expect(result.missing).toEqual([field]);
    },
  );

  it('needs the hip for a woman', () => {
    const result = metrics({ ...NAVY_WOMAN, hipCm: null });

    expect(result.bodyFat).toBeUndefined();
    expect(result.missing).toContain('hipCm');
  });

  it("doesn't need the hip for a man", () => {
    expect(metrics(MAN).missing).not.toContain('hipCm');
  });

  it("doesn't list the hip while sex is unset", () => {
    expect(
      metrics({ ...NAVY_WOMAN, sex: null, hipCm: null }).missing,
    ).not.toContain('hipCm');
  });

  it('needs sex for body fat', () => {
    const result = metrics({ ...MAN, sex: null });

    expect(result.bodyFat).toBeUndefined();
  });

  it.each(['sex', 'activityLevel'] as const)(
    'shows BMI but no calories without %s',
    (field) => {
      const result = metrics({ ...MAN, [field]: null });

      expect(result.bmi).toBeDefined();
      expect(result.calories).toBeUndefined();
      expect(result.missing).toEqual([field]);
    },
  );

  it('shows BMI but no calories with complete Body stats and no date of birth', () => {
    const result = bodyMetrics({ bodyStats: MAN, today: TODAY });

    expect(result.bmi).toBeDefined();
    expect(result.calories).toBeUndefined();
    expect(result.missing).toEqual(['dateOfBirth']);
  });

  it('misses nothing when complete', () => {
    expect(metrics(MAN).missing).toEqual([]);
  });
});
