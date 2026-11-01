import {
  EMPTY_NUTRITION,
  NUTRITION_COLUMNS,
} from '@/app/(modules)/dashboard/(modules)/_nutrition/constants';
import {
  INutrition,
  INutritionAmount,
  INutritionColumn,
} from '@/app/(modules)/dashboard/(modules)/_nutrition/interfaces';
import { describe, expect, it } from 'vitest';
import {
  formatNutrition,
  mealIngredientNutrition,
  mealNutrition,
  mealPlanNutrition,
} from '@/app/(modules)/dashboard/(modules)/_nutrition/helpers';

import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';

const amount = (
  unit: EUnit,
  quantity: number,
  nutrition: Partial<INutrition>,
): INutritionAmount => ({ ...EMPTY_NUTRITION, ...nutrition, unit, quantity });

const CALORIES: INutritionColumn = { nutrient: 'calories', unit: 'kcal' };
const PROTEIN: INutritionColumn = { nutrient: 'protein', unit: 'g' };
const FAT: INutritionColumn = {
  nutrient: 'totalFat',
  subNutrient: 'saturatedFat',
  unit: 'g',
};

describe('mealIngredientNutrition', () => {
  it('scales a 100 g Ingredient by grams / 100', () => {
    expect(
      mealIngredientNutrition(amount(EUnit.HUNDRED_GRAMS, 150, { protein: 10 }))
        .protein,
    ).toBe(15);
  });

  it('scales a piece Ingredient by the count', () => {
    expect(
      mealIngredientNutrition(amount(EUnit.PIECE, 2, { calories: 80 }))
        .calories,
    ).toBe(160);
  });
});

describe('mealNutrition', () => {
  it('sums its Meal ingredients', () => {
    const nutrition = mealNutrition({
      mealIngredients: [
        amount(EUnit.HUNDRED_GRAMS, 200, { calories: 100, protein: 5 }),
        amount(EUnit.PIECE, 3, { calories: 50, protein: 1 }),
      ],
    });

    expect(nutrition.calories).toBe(350);
    expect(nutrition.protein).toBe(13);
  });

  it('shows 200 kcal for 200 g of a 100 kcal / 100 g Ingredient', () => {
    const nutrition = mealNutrition({
      mealIngredients: [amount(EUnit.HUNDRED_GRAMS, 200, { calories: 100 })],
    });

    expect(formatNutrition(nutrition, CALORIES, 'en').value).toBe('200');
  });

  it('rounds for display in the locale', () => {
    const nutrition = mealNutrition({
      mealIngredients: [
        amount(EUnit.PIECE, 1, { totalFat: 1234.56, saturatedFat: 0.04 }),
      ],
    });

    expect(formatNutrition(nutrition, FAT, 'en')).toEqual({
      value: '1,234.6',
      sub: '0',
    });
  });

  it('totals unrounded values', () => {
    const nutrition = mealNutrition({
      mealIngredients: [0, 1, 2].map(() =>
        amount(EUnit.PIECE, 1, { protein: 0.05 }),
      ),
    });

    expect(formatNutrition(nutrition, PROTEIN, 'en').value).toBe('0.2');
  });

  it('is all zeros without Meal ingredients, displayed as 0', () => {
    const nutrition = mealNutrition({ mealIngredients: [] });

    expect(nutrition).toEqual(EMPTY_NUTRITION);
    expect(
      NUTRITION_COLUMNS.map((column) =>
        formatNutrition(nutrition, column, 'en'),
      ),
    ).toEqual([
      { value: '0', sub: undefined },
      { value: '0', sub: undefined },
      { value: '0', sub: '0' },
      { value: '0', sub: '0' },
      { value: '0', sub: undefined },
    ]);
  });
});

describe('mealPlanNutrition', () => {
  it('sums its Meals', () => {
    const breakfast = {
      mealIngredients: [amount(EUnit.PIECE, 2, { calories: 80 })],
    };
    const lunch = {
      mealIngredients: [
        amount(EUnit.HUNDRED_GRAMS, 250, { calories: 120, totalFat: 4 }),
      ],
    };

    const nutrition = mealPlanNutrition({ meals: [breakfast, lunch] });

    expect(nutrition.calories).toBe(460);
    expect(nutrition.totalFat).toBe(10);
  });
});

describe('formatNutrition', () => {
  it('rounds to one decimal, the sub-nutrient too', () => {
    expect(
      formatNutrition(
        { ...EMPTY_NUTRITION, totalFat: 12.46, saturatedFat: 3.14 },
        FAT,
        'en',
      ),
    ).toEqual({ value: '12.5', sub: '3.1' });
  });
});
