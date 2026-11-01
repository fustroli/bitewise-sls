import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMeal,
  deleteMeal,
  updateMeal,
} from '@/app/(modules)/dashboard/(modules)/meals/queries';

import { api } from '@/app/lib/api';

vi.mock('@/app/lib/api', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  api: vi.fn(async () => ({ ok: true, data: undefined })),
}));

const ID = '01JAZ3Q8V6X2M5N7P9R1S3T5W7';
const INGREDIENT_ID = '01JAZ3Q8V6X2M5N7P9R1S3T5W8';

const MEAL = {
  name: 'Breakfast',
  mealIngredients: [{ ingredientId: INGREDIENT_ID, quantity: 100 }],
};

beforeEach(() => {
  vi.mocked(api).mockClear();
});

describe('meal queries', () => {
  it('rejects a path-traversal id without calling the API', async () => {
    expect(await deleteMeal('../users/me')).toMatchObject({ status: 400 });
    expect(await updateMeal(MEAL, '../users/me')).toMatchObject({
      status: 400,
    });
    expect(api).not.toHaveBeenCalled();
  });

  it('rejects unknown fields, also when nested', async () => {
    const result = await createMeal({
      ...MEAL,
      mealIngredients: [
        { ingredientId: INGREDIENT_ID, quantity: 100, mealId: 9 },
      ],
    } as any);

    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(api).not.toHaveBeenCalled();
  });

  it('rejects an Ingredient twice', async () => {
    const twice = {
      ...MEAL,
      mealIngredients: [...MEAL.mealIngredients, ...MEAL.mealIngredients],
    };

    expect(await createMeal(twice)).toMatchObject({ ok: false, status: 400 });
    expect(api).not.toHaveBeenCalled();
  });

  it('sends a valid update to the id', async () => {
    await updateMeal(MEAL, ID);

    expect(api).toHaveBeenCalledWith(`meal/${ID}`, {
      method: 'PATCH',
      body: MEAL,
    });
  });
});
