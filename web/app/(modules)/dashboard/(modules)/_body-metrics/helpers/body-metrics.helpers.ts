import {
  ACTIVITY_MULTIPLIERS,
  BMI_BANDS,
  BMI_DISPLAY_DECIMALS,
  BMR,
  BODY_FAT_BANDS,
  BODY_FAT_DISPLAY_DECIMALS,
  CALORIE_DISPLAY_DECIMALS,
  CALORIE_PACES,
  CM_PER_M,
  HEALTHY_BMI,
  MACRO_DISPLAY_DECIMALS,
  MACRO_KCAL_PER_GRAM,
  MACRO_LIMIT_SHARE,
  MACRO_PLANS,
  MACRO_PLAN_ORDER,
  MACRO_RANGES,
  PLAUSIBLE_BODY_FAT,
  SAFE_MINIMUM_CALORIES,
  US_NAVY,
  WEIGHT_DISPLAY_DECIMALS,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/constants';
import {
  EActivityLevel,
  ECalorieTarget,
  ESex,
} from '@/app/(modules)/dashboard/(modules)/_user/enums';
import {
  IBmi,
  IBmiBand,
  IBodyFat,
  IBodyFatBand,
  IBodyMetrics,
  IBodyMetricsInput,
  ICalorieTarget,
  ICalories,
  IMacroAmount,
  IMacros,
  IPacedCalorieTarget,
  TBodyMetricsField,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/interfaces';

import { interpolate } from '@/app/utils/helpers';

const PERCENT = 100;

const DIRECTION = { lose: -1, gain: 1 } as const;

type TDirection = keyof typeof DIRECTION;

/** Whole years from `dateOfBirth` to `today`, both as local calendar days. */
export const ageOn = (dateOfBirth: Date, today: Date) => {
  const hadBirthday =
    today.getMonth() > dateOfBirth.getMonth() ||
    (today.getMonth() === dateOfBirth.getMonth() &&
      today.getDate() >= dateOfBirth.getDate());

  return today.getFullYear() - dateOfBirth.getFullYear() - Number(!hadBirthday);
};

/** The stored date of birth's UTC calendar day, as a local Date. */
const birthDay = (dateOfBirth: string) => {
  const date = new Date(dateOfBirth);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const bmiCategory = (bmi: number) =>
  BMI_BANDS.findLast(({ min }) => min === undefined || bmi >= min)!.category;

const computeBmi = (heightCm: number, weightKg: number): IBmi => {
  const heightM = heightCm / CM_PER_M;
  const squareM = heightM * heightM;
  const value = weightKg / squareM;

  return {
    value,
    category: bmiCategory(value),
    healthyWeight: {
      minKg: HEALTHY_BMI.min * squareM,
      maxKg: HEALTHY_BMI.max * squareM,
    },
  };
};

interface IBodyFatInput {
  sex: ESex;
  heightCm: number;
  weightKg: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number | null;
}

/** Unset when the measurements can't be right (e.g. waist ≤ neck). */
const computeBodyFat = ({
  sex,
  heightCm,
  weightKg,
  neckCm,
  waistCm,
  hipCm,
}: IBodyFatInput): IBodyFat | undefined => {
  if (sex === ESex.FEMALE && !hipCm) return undefined;

  const girth =
    sex === ESex.FEMALE ? waistCm + hipCm! - neckCm : waistCm - neckCm;
  if (girth <= 0) return undefined;

  const { constant, perLogGirth, perLogHeight } = US_NAVY.bySex[sex];
  const percent =
    US_NAVY.numerator /
      (constant -
        perLogGirth * Math.log10(girth) +
        perLogHeight * Math.log10(heightCm)) -
    US_NAVY.offset;
  if (percent < PLAUSIBLE_BODY_FAT.min || percent > PLAUSIBLE_BODY_FAT.max) {
    return undefined;
  }

  const fatMassKg = (weightKg * percent) / PERCENT;

  return {
    percent,
    category: BODY_FAT_BANDS[sex].findLast(
      ({ min }) => min === undefined || percent >= min,
    )!.category,
    fatMassKg,
    leanMassKg: weightKg - fatMassKg,
  };
};

const computeCalories = (
  sex: ESex,
  heightCm: number,
  weightKg: number,
  activityLevel: EActivityLevel,
  age: number,
  picked: ECalorieTarget,
): ICalories => {
  const bmr =
    BMR.perKg * weightKg +
    BMR.perCm * heightCm +
    BMR.perYear * age +
    BMR.bySex[sex];
  const maintenance = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  const safeMinimum = SAFE_MINIMUM_CALORIES[sex];

  const calorieTarget = (
    target: ECalorieTarget,
    kgPerWeek: number,
    kcalPerDay: number,
  ): ICalorieTarget => ({
    target,
    kgPerWeek,
    kcalPerDay,
    percentOfMaintenance: (kcalPerDay / maintenance) * PERCENT,
    belowSafeMinimum: kcalPerDay < safeMinimum,
  });

  const targets = (direction: TDirection): IPacedCalorieTarget[] =>
    CALORIE_PACES.map((pace) => ({
      pace: pace.pace,
      ...calorieTarget(
        pace[direction],
        DIRECTION[direction] * pace.kgPerWeek,
        maintenance + DIRECTION[direction] * pace.kcalPerDay,
      ),
    }));

  const maintenanceTarget = calorieTarget(
    ECalorieTarget.MAINTENANCE,
    0,
    maintenance,
  );
  const lose = targets('lose');
  const gain = targets('gain');

  return {
    maintenance,
    safeMinimum,
    maintenanceTarget,
    lose,
    gain,
    target:
      [...lose, ...gain].find(({ target }) => target === picked) ??
      maintenanceTarget,
  };
};

/** The Macro plans for `kcal` a day; `weightKg` sets the protein minimum. */
const computeMacros = (kcal: number, weightKg: number): IMacros => {
  const { protein, carbs, fat } = MACRO_KCAL_PER_GRAM;
  const minProtein = MACRO_RANGES.proteinMinGramsPerKg * weightKg;
  const minFat = (MACRO_RANGES.fatMinShare * kcal) / fat;
  const maxCarbs = (kcal - minProtein * protein - minFat * fat) / carbs;
  const range = {
    protein: {
      minGrams: minProtein,
      maxGrams: (MACRO_RANGES.proteinMaxShare * kcal) / protein,
    },
    carbs: {
      minGrams: (MACRO_RANGES.carbsMinShare * kcal) / carbs,
      maxGrams: maxCarbs,
    },
    fat: {
      minGrams: minFat,
      maxGrams: (MACRO_RANGES.fatMaxShare * kcal) / fat,
    },
  };

  const amount = (macro: keyof typeof range, share: number): IMacroAmount => ({
    grams: (share * kcal) / MACRO_KCAL_PER_GRAM[macro],
    kcal: share * kcal,
    percent: share * PERCENT,
    ...range[macro],
  });

  return {
    kcalPerDay: kcal,
    plans: MACRO_PLAN_ORDER.map((plan) => ({
      plan,
      protein: amount('protein', MACRO_PLANS[plan].protein),
      carbs: amount('carbs', MACRO_PLANS[plan].carbs),
      fat: amount('fat', MACRO_PLANS[plan].fat),
    })),
    sugarMaxGrams: (MACRO_LIMIT_SHARE * kcal) / carbs,
    saturatedFatMaxGrams: (MACRO_LIMIT_SHARE * kcal) / fat,
  };
};

/**
 * BMI, body fat and Calorie targets from the User's Body stats and date of
 * birth, at full precision, with the Macro plans at the picked Calorie
 * target. Whatever can't be computed yet is left unset and its inputs are
 * listed in `missing`.
 */
export const bodyMetrics = ({
  bodyStats = {},
  dateOfBirth,
  calorieTarget,
  today,
}: IBodyMetricsInput): IBodyMetrics => {
  const { sex, heightCm, weightKg, neckCm, waistCm, hipCm, activityLevel } =
    bodyStats;
  const missing = (
    [
      ['heightCm', heightCm],
      ['weightKg', weightKg],
      ['sex', sex],
      ['neckCm', neckCm],
      ['waistCm', waistCm],
      ...(sex === ESex.FEMALE ? [['hipCm', hipCm]] : []),
      ['activityLevel', activityLevel],
      ['dateOfBirth', dateOfBirth],
    ] as [TBodyMetricsField, unknown][]
  )
    .filter(([, value]) => value === null || value === undefined)
    .map(([field]) => field);

  if (!heightCm || !weightKg) return { missing };

  const calories =
    sex && activityLevel && dateOfBirth
      ? computeCalories(
          sex,
          heightCm,
          weightKg,
          activityLevel,
          ageOn(birthDay(dateOfBirth), today),
          calorieTarget ?? ECalorieTarget.MAINTENANCE,
        )
      : undefined;

  return {
    bmi: computeBmi(heightCm, weightKg),
    bodyFat:
      sex && neckCm && waistCm
        ? computeBodyFat({ sex, heightCm, weightKg, neckCm, waistCm, hipCm })
        : undefined,
    calories,
    macros: calories && computeMacros(calories.target.kcalPerDay, weightKg),
    missing,
  };
};

const formatDecimal = (value: number, decimals: number, locale: string) =>
  value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/** e.g. `22.4` */
export const formatBmi = (value: number, locale: string) =>
  formatDecimal(value, BMI_DISPLAY_DECIMALS, locale);

const formatBand = (
  { min, max }: IBmiBand | IBodyFatBand,
  locale: string,
  unit = '',
) => {
  const format = (value: number) => value.toLocaleString(locale);

  if (min === undefined) return `< ${format(max!)}${unit}`;
  if (max === undefined) return `≥ ${format(min)}${unit}`;
  return `${format(min)} – ${format(max)}${unit}`;
};

/** e.g. `< 16`, `18.5 – 25`, `≥ 40` */
export const formatBmiBand = (band: IBmiBand, locale: string) =>
  formatBand(band, locale);

/** e.g. `15.7%` */
export const formatBodyFat = (percent: number, locale: string) =>
  (percent / PERCENT).toLocaleString(locale, {
    style: 'percent',
    minimumFractionDigits: BODY_FAT_DISPLAY_DECIMALS,
    maximumFractionDigits: BODY_FAT_DISPLAY_DECIMALS,
  });

/** e.g. `< 14%`, `14 – 21%`, `≥ 32%` */
export const formatBodyFatBand = (band: IBodyFatBand, locale: string) =>
  formatBand(band, locale, '%');

/** e.g. `59.9` */
export const formatWeight = (kg: number, locale: string) =>
  formatDecimal(kg, WEIGHT_DISPLAY_DECIMALS, locale);

/** Whole kcal, e.g. `2,520` */
export const formatCalories = (kcal: number, locale: string) =>
  formatDecimal(kcal, CALORIE_DISPLAY_DECIMALS, locale);

/** Whole percent, e.g. `90%` */
export const formatPercent = (percent: number, locale: string) =>
  (percent / PERCENT).toLocaleString(locale, { style: 'percent' });

/** Whole grams, e.g. `159` */
export const formatGrams = (grams: number, locale: string) =>
  formatDecimal(grams, MACRO_DISPLAY_DECIMALS, locale);

/** Signed, e.g. `-0.25` or `+1` */
export const formatKgPerWeek = (kgPerWeek: number, locale: string) =>
  kgPerWeek.toLocaleString(locale, { signDisplay: 'always' });

/** A Calorie target's name in copy, e.g. `Maintenance` or `Lose 0.5 kg/wk`. */
export const calorieTargetName = (
  { kgPerWeek }: ICalorieTarget,
  names: { maintenance: string; lose: string; gain: string },
  locale: string,
) => {
  if (kgPerWeek === 0) return names.maintenance;
  return interpolate(kgPerWeek < 0 ? names.lose : names.gain, {
    kg: Math.abs(kgPerWeek).toLocaleString(locale),
  });
};
