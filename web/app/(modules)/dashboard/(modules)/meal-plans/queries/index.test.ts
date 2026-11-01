import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMealPlan,
  deleteMealPlan,
  updateMealPlan,
} from '@/app/(modules)/dashboard/(modules)/meal-plans/queries';

import { api } from '@/app/lib/api';

vi.mock('@/app/lib/api', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  api: vi.fn(async () => ({ ok: true, data: undefined })),
}));

const ID = '01JAZ3Q8V6X2M5N7P9R1S3T5W7';
const MEAL_IDS = ['01JAZ3Q8V6X2M5N7P9R1S3T5W8', '01JAZ3Q8V6X2M5N7P9R1S3T5W9'];
const MEAL_PLAN = { name: 'Week 1', mealIds: MEAL_IDS };

beforeEach(() => {
  vi.mocked(api).mockClear();
});

describe('meal plan queries', () => {
  it('rejects a path-traversal id without calling the API', async () => {
    expect(await deleteMealPlan('../users/me')).toMatchObject({ status: 400 });
    expect(await updateMealPlan(MEAL_PLAN, '../users/me')).toMatchObject({
      status: 400,
    });
    expect(api).not.toHaveBeenCalled();
  });

  it('rejects unknown fields', async () => {
    const result = await createMealPlan({ ...MEAL_PLAN, userId: 2 } as any);

    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(api).not.toHaveBeenCalled();
  });

  it('creates a valid meal plan', async () => {
    await createMealPlan(MEAL_PLAN);

    expect(api).toHaveBeenCalledWith('meal-plan', {
      method: 'POST',
      body: MEAL_PLAN,
    });
  });

  it('sends a valid update to the id', async () => {
    await updateMealPlan(MEAL_PLAN, ID);

    expect(api).toHaveBeenCalledWith(`meal-plan/${ID}`, {
      method: 'PATCH',
      body: MEAL_PLAN,
    });
  });
});
