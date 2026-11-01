import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createIngredient,
  deleteIngredient,
  fetchIngredientsByIds,
  updateIngredient,
} from '@/app/(modules)/dashboard/(modules)/ingredients/queries';

import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';
import { api } from '@/app/lib/api';

vi.mock('@/app/lib/api', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  api: vi.fn(async () => ({ ok: true, data: undefined })),
}));

const ID = '01JAZ3Q8V6X2M5N7P9R1S3T5W7';

const INGREDIENT = {
  name: 'Oats',
  protein: 13,
  totalFat: 7,
  saturatedFat: 1,
  totalCarbohydrates: 68,
  sugar: 1,
  dietaryFiber: 10,
  calories: 389,
  unit: EUnit.HUNDRED_GRAMS,
};

beforeEach(() => {
  vi.mocked(api).mockClear();
});

describe('ingredient queries', () => {
  it.each(['../users/me', '1/../../users/me', '7', ''])(
    'rejects the id %j without calling the API',
    async (id) => {
      expect(await deleteIngredient(id)).toMatchObject({
        ok: false,
        status: 400,
      });
      expect(await updateIngredient(INGREDIENT, id)).toMatchObject({
        ok: false,
        status: 400,
      });
      expect(api).not.toHaveBeenCalled();
    },
  );

  it('rejects fields the API does not know', async () => {
    const result = await createIngredient({ ...INGREDIENT, userId: 2 } as any);

    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(api).not.toHaveBeenCalled();
  });

  it.each([
    ['a negative nutrient', { calories: -1 }],
    ['more saturated than total fat', { saturatedFat: 8 }],
  ])('rejects %s without calling the API', async (_, change) => {
    expect(await createIngredient({ ...INGREDIENT, ...change })).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(api).not.toHaveBeenCalled();
  });

  it('creates a valid ingredient', async () => {
    await createIngredient(INGREDIENT);

    expect(api).toHaveBeenCalledWith('ingredient', {
      method: 'POST',
      body: INGREDIENT,
    });
  });

  it('sends a valid update to the id', async () => {
    await updateIngredient(INGREDIENT, ID);

    expect(api).toHaveBeenCalledWith(`ingredient/${ID}`, {
      method: 'PATCH',
      body: INGREDIENT,
    });
  });

  it('deletes by id', async () => {
    await deleteIngredient(ID);

    expect(api).toHaveBeenCalledWith(`ingredient/${ID}`, { method: 'DELETE' });
  });

  it('fetches by ids and unwraps the page', async () => {
    vi.mocked(api).mockResolvedValueOnce({
      ok: true,
      data: { data: [{ id: ID }], count: 1 },
    });

    expect(await fetchIngredientsByIds([ID])).toEqual({
      ok: true,
      data: [{ id: ID }],
    });
    expect(api).toHaveBeenCalledWith('ingredient', { query: { ids: ID } });
  });

  it('fetches no more than the API takes by ids', async () => {
    const ids = Array.from({ length: 101 }, () => ID);

    expect(await fetchIngredientsByIds(ids)).toMatchObject({ ok: false });
    expect(api).not.toHaveBeenCalled();
  });
});
