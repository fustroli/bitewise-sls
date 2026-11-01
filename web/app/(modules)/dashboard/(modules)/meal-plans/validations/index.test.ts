import { describe, expect, it } from 'vitest';

import { createMealPlanSchema } from '@/app/(modules)/dashboard/(modules)/meal-plans/validations';
import { copy as en } from '@/app/copy';

const schema = createMealPlanSchema(en);

describe('createMealPlanSchema', () => {
  it('requires at least one Meal', () => {
    expect(
      schema.safeParse({ name: 'Week', mealIds: [] }).error?.issues,
    ).toMatchObject([
      {
        path: ['mealIds'],
        message: en.resources.mealPlans.validation.mealsRequired,
      },
    ]);
  });

  it('accepts a Meal plan with Meals', () => {
    const mealIds = [
      '01JAZ3Q8V6X2M5N7P9R1S3T5W1',
      '01JAZ3Q8V6X2M5N7P9R1S3T5W2',
    ];

    expect(schema.safeParse({ name: 'Week', mealIds }).success).toBe(true);
  });
});
