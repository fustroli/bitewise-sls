import { describe, expect, it } from 'vitest';

import { createMealSchema } from '@/app/(modules)/dashboard/(modules)/meals/validations';
import { copy as en } from '@/app/copy';

const schema = createMealSchema(en);
const [OATS, BANANA] = [
  '01JAZ3Q8V6X2M5N7P9R1S3T5W1',
  '01JAZ3Q8V6X2M5N7P9R1S3T5W2',
];
const { validation } = en.resources.meals;

const issues = (
  mealIngredients: { ingredientId: string; quantity: number }[],
) =>
  schema.safeParse({ name: 'Breakfast', mealIngredients }).error?.issues ?? [];

describe('createMealSchema', () => {
  it('accepts distinct Ingredients', () => {
    expect(
      issues([
        { ingredientId: OATS, quantity: 100 },
        { ingredientId: BANANA, quantity: 1 },
      ]),
    ).toEqual([]);
  });

  it('requires at least one Meal ingredient', () => {
    expect(issues([])).toMatchObject([
      { path: ['mealIngredients'], message: validation.ingredientsRequired },
    ]);
  });

  it('flags a repeated Ingredient on the repeat', () => {
    expect(
      issues([
        { ingredientId: OATS, quantity: 100 },
        { ingredientId: BANANA, quantity: 1 },
        { ingredientId: OATS, quantity: 50 },
      ]),
    ).toMatchObject([
      {
        path: ['mealIngredients', 2, 'ingredientId'],
        message: validation.ingredientDuplicate,
      },
    ]);
  });

  it('does not count unpicked rows as repeats', () => {
    expect(
      issues([
        { ingredientId: '', quantity: 1 },
        { ingredientId: '', quantity: 1 },
      ]).map(({ message }) => message),
    ).toEqual([validation.ingredientRequired, validation.ingredientRequired]);
  });
});
