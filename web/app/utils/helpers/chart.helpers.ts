/** Energy per gram for a macro's share of a food's calories, kcal. */
export const MACRO_ENERGY_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };

export interface IMacroGrams {
  protein: number;
  carbs: number;
  fat: number;
}

const PERCENT = 100;

/**
 * Each macro's share of the energy the three give, as fractions of 1 that sum
 * to 1. All zeros when there is no energy (nothing to split).
 */
export const macroEnergyShares = (grams: IMacroGrams): IMacroGrams => {
  const energy = {
    protein: Math.max(grams.protein, 0) * MACRO_ENERGY_PER_GRAM.protein,
    carbs: Math.max(grams.carbs, 0) * MACRO_ENERGY_PER_GRAM.carbs,
    fat: Math.max(grams.fat, 0) * MACRO_ENERGY_PER_GRAM.fat,
  };
  const total = energy.protein + energy.carbs + energy.fat;
  if (!total) return { protein: 0, carbs: 0, fat: 0 };

  return {
    protein: energy.protein / total,
    carbs: energy.carbs / total,
    fat: energy.fat / total,
  };
};

/** Where `value` sits between `min` and `max`, in % (0–100), clamped. */
export const scalePosition = (value: number, min: number, max: number) => {
  if (max <= min) return 0;
  const position = ((value - min) / (max - min)) * PERCENT;
  return Math.min(Math.max(position, 0), PERCENT);
};

/** `value` as a % of `target`, capped at 100; 0 without a target. */
export const progressPercent = (value: number, target: number) =>
  target > 0 ? scalePosition(value, 0, target) : 0;
