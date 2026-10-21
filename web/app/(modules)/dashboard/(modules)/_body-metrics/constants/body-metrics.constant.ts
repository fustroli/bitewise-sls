import {
  EActivityLevel,
  ECalorieTarget,
  EMacroPlan,
  ESex,
} from '@/app/(modules)/dashboard/(modules)/_user/enums';
import {
  EBmiCategory,
  EBodyFatCategory,
  ECaloriePace,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/enums';
import {
  IBmiBand,
  IBodyFatBand,
  IMacroShares,
  TBodyMetricsField,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/interfaces';

/** The adult WHO table, lowest band first. */
export const BMI_BANDS: IBmiBand[] = [
  { category: EBmiCategory.SEVERE_THINNESS, max: 16 },
  { category: EBmiCategory.MODERATE_THINNESS, min: 16, max: 17 },
  { category: EBmiCategory.MILD_THINNESS, min: 17, max: 18.5 },
  { category: EBmiCategory.NORMAL, min: 18.5, max: 25 },
  { category: EBmiCategory.OVERWEIGHT, min: 25, max: 30 },
  { category: EBmiCategory.OBESE_CLASS_I, min: 30, max: 35 },
  { category: EBmiCategory.OBESE_CLASS_II, min: 35, max: 40 },
  { category: EBmiCategory.OBESE_CLASS_III, min: 40 },
];

export const HEALTHY_BMI = { min: 18.5, max: 25 };

export const CM_PER_M = 100;

/** Mifflin-St Jeor: 10·kg + 6.25·cm − 5·age + the sex's constant. */
export const BMR = {
  perKg: 10,
  perCm: 6.25,
  perYear: -5,
  bySex: { [ESex.MALE]: 5, [ESex.FEMALE]: -161 },
} as const;

export const ACTIVITY_MULTIPLIERS: Record<EActivityLevel, number> = {
  [EActivityLevel.SEDENTARY]: 1.2,
  [EActivityLevel.LIGHT]: 1.375,
  [EActivityLevel.MODERATE]: 1.465,
  [EActivityLevel.ACTIVE]: 1.55,
  [EActivityLevel.VERY_ACTIVE]: 1.725,
  [EActivityLevel.EXTRA_ACTIVE]: 1.9,
};

/**
 * Daily offsets from Maintenance calories, as calculator.net uses them, with
 * the Calorie target that loses or gains at each pace.
 */
export const CALORIE_PACES = [
  {
    pace: ECaloriePace.MILD,
    kgPerWeek: 0.25,
    kcalPerDay: 250,
    lose: ECalorieTarget.LOSE_MILD,
    gain: ECalorieTarget.GAIN_MILD,
  },
  {
    pace: ECaloriePace.NORMAL,
    kgPerWeek: 0.5,
    kcalPerDay: 500,
    lose: ECalorieTarget.LOSE_NORMAL,
    gain: ECalorieTarget.GAIN_NORMAL,
  },
  {
    pace: ECaloriePace.FAST,
    kgPerWeek: 1,
    kcalPerDay: 1000,
    lose: ECalorieTarget.LOSE_FAST,
    gain: ECalorieTarget.GAIN_FAST,
  },
];

/** Calorie targets below these are flagged, kcal/day. */
export const SAFE_MINIMUM_CALORIES: Record<ESex, number> = {
  [ESex.MALE]: 1500,
  [ESex.FEMALE]: 1200,
};

/**
 * US Navy body fat, metric: 495 / (constant − perLogGirth·log10(girth) +
 * perLogHeight·log10(height)) − 450. Girth is waist − neck for a man,
 * waist + hip − neck for a woman.
 */
export const US_NAVY = {
  numerator: 495,
  offset: 450,
  bySex: {
    [ESex.MALE]: {
      constant: 1.0324,
      perLogGirth: 0.19077,
      perLogHeight: 0.15456,
    },
    [ESex.FEMALE]: {
      constant: 1.29579,
      perLogGirth: 0.35004,
      perLogHeight: 0.221,
    },
  },
} as const;

/** Body fat outside this range, in %, means the measurements are off. */
export const PLAUSIBLE_BODY_FAT = { min: 0, max: 75 };

/** The ACE table per sex, lowest band first. */
export const BODY_FAT_BANDS: Record<ESex, IBodyFatBand[]> = {
  [ESex.FEMALE]: [
    { category: EBodyFatCategory.ESSENTIAL, max: 14 },
    { category: EBodyFatCategory.ATHLETES, min: 14, max: 21 },
    { category: EBodyFatCategory.FITNESS, min: 21, max: 25 },
    { category: EBodyFatCategory.AVERAGE, min: 25, max: 32 },
    { category: EBodyFatCategory.OBESE, min: 32 },
  ],
  [ESex.MALE]: [
    { category: EBodyFatCategory.ESSENTIAL, max: 6 },
    { category: EBodyFatCategory.ATHLETES, min: 6, max: 14 },
    { category: EBodyFatCategory.FITNESS, min: 14, max: 18 },
    { category: EBodyFatCategory.AVERAGE, min: 18, max: 25 },
    { category: EBodyFatCategory.OBESE, min: 25 },
  ],
};

/** The inputs body fat needs; `hipCm` is only ever missing for a woman. */
export const BODY_FAT_FIELDS: TBodyMetricsField[] = [
  'sex',
  'heightCm',
  'weightKg',
  'neckCm',
  'waistCm',
  'hipCm',
];

export const BMI_DISPLAY_DECIMALS = 1;

export const BODY_FAT_DISPLAY_DECIMALS = 1;

export const CALORIE_DISPLAY_DECIMALS = 0;

export const WEIGHT_DISPLAY_DECIMALS = 1;

/** Energy per gram as calculator.net uses it, kcal. */
export const MACRO_KCAL_PER_GRAM = { protein: 4.1, carbs: 3.75, fat: 8.8 };

/** Each plan's share of calories, as fractions of 1. */
export const MACRO_PLANS: Record<EMacroPlan, IMacroShares> = {
  [EMacroPlan.BALANCED]: { protein: 0.25, carbs: 0.5, fat: 0.25 },
  [EMacroPlan.LOW_FAT]: { protein: 0.275, carbs: 0.525, fat: 0.2 },
  [EMacroPlan.LOW_CARB]: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  [EMacroPlan.HIGH_PROTEIN]: { protein: 0.35, carbs: 0.425, fat: 0.225 },
};

/** Display order of the plans. */
export const MACRO_PLAN_ORDER: EMacroPlan[] = [
  EMacroPlan.BALANCED,
  EMacroPlan.LOW_FAT,
  EMacroPlan.LOW_CARB,
  EMacroPlan.HIGH_PROTEIN,
];

/**
 * Bounds of each macro's range. Protein starts at 1 g per kg; carbs end where
 * the minimum protein and fat leave room.
 */
export const MACRO_RANGES = {
  proteinMinGramsPerKg: 1,
  proteinMaxShare: 0.35,
  carbsMinShare: 0.4,
  fatMinShare: 0.2,
  fatMaxShare: 0.35,
};

/** Sugar and saturated fat stay under this share of calories. */
export const MACRO_LIMIT_SHARE = 0.1;

export const MACRO_DISPLAY_DECIMALS = 0;
