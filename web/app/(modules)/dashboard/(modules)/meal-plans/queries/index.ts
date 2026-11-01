import {
  ICreateMealPlan,
  IMealPlan,
  IMealPlanOption,
} from '@/app/(modules)/dashboard/(modules)/meal-plans/interfaces';
import { IQueryParams, TApiResult } from '@/app/utils/interfaces';
import { api, unwrap } from '@/app/lib/api';
import { idSchema, parseInput } from '@/app/utils/helpers';

import { IResourcePage } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { MAX_IDS_PER_FETCH } from '@/app/utils/constants';
import { QUERY_KEYS } from '@/app/(modules)/dashboard/(modules)/_resource-table/constants';
import { createMealPlanSchema } from '@bitewise/shared';
import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

export const mealPlanListQuery = (params: IQueryParams) =>
  queryOptions({
    queryKey: [...QUERY_KEYS.mealPlans, 'list', params],
    queryFn: async () =>
      unwrap(
        await api<IResourcePage<IMealPlan>>('meal-plan', { query: params }),
      ),
  });

/** Every Meal plan of the User, by name, as a picker offers them. */
export const mealPlanOptionsQuery = queryOptions({
  queryKey: [...QUERY_KEYS.mealPlans, 'options'],
  queryFn: async () =>
    unwrap(await api<IMealPlanOption[]>('meal-plan/options')),
});

export async function createMealPlan(mealPlan: ICreateMealPlan) {
  const input = parseInput(createMealPlanSchema, mealPlan);
  if (!input.ok) return input;

  return api<IMealPlan>('meal-plan', { method: 'POST', body: input.data });
}

export async function updateMealPlan(
  mealPlan: ICreateMealPlan,
  mealPlanId: string,
) {
  // The form always sends the whole Meal plan.
  const input = parseInput(z.tuple([createMealPlanSchema, idSchema]), [
    mealPlan,
    mealPlanId,
  ]);
  if (!input.ok) return input;

  const [body, id] = input.data;
  return api<IMealPlan>(`meal-plan/${id}`, { method: 'PATCH', body });
}

export async function deleteMealPlan(mealPlanId: string) {
  const input = parseInput(idSchema, mealPlanId);
  if (!input.ok) return input;

  return api(`meal-plan/${input.data}`, { method: 'DELETE' });
}

/** The User's Meal plans among `ids`, in full; ids not returned are gone. */
export async function fetchMealPlansByIds(
  ids: string[],
): Promise<TApiResult<IMealPlan[]>> {
  const input = parseInput(
    z.array(idSchema).min(1).max(MAX_IDS_PER_FETCH),
    ids,
  );
  if (!input.ok) return input;

  const result = await api<IResourcePage<IMealPlan>>('meal-plan', {
    query: { ids: input.data.join(',') },
  });
  return result.ok ? { ok: true, data: result.data.data } : result;
}
