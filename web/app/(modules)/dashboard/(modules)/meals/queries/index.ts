import {
  ICreateMeal,
  IMeal,
  IMealOption,
} from '@/app/(modules)/dashboard/(modules)/meals/interfaces';
import { IQueryParams, TApiResult } from '@/app/utils/interfaces';
import { api, unwrap } from '@/app/lib/api';
import { idSchema, parseInput } from '@/app/utils/helpers';

import { IResourcePage } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { MAX_IDS_PER_FETCH } from '@/app/utils/constants';
import { QUERY_KEYS } from '@/app/(modules)/dashboard/(modules)/_resource-table/constants';
import { createMealSchema } from '@bitewise/shared';
import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

export const mealListQuery = (params: IQueryParams) =>
  queryOptions({
    queryKey: [...QUERY_KEYS.meals, 'list', params],
    queryFn: async () =>
      unwrap(await api<IResourcePage<IMeal>>('meal', { query: params })),
  });

/** Every Meal of the User, by name, as a picker offers them. */
export const mealOptionsQuery = queryOptions({
  queryKey: [...QUERY_KEYS.meals, 'options'],
  queryFn: async () => unwrap(await api<IMealOption[]>('meal/options')),
});

export async function createMeal(meal: ICreateMeal) {
  const input = parseInput(createMealSchema, meal);
  if (!input.ok) return input;

  return api<IMeal>('meal', { method: 'POST', body: input.data });
}

export async function updateMeal(meal: ICreateMeal, mealId: string) {
  // The form always sends the whole Meal.
  const input = parseInput(z.tuple([createMealSchema, idSchema]), [
    meal,
    mealId,
  ]);
  if (!input.ok) return input;

  const [body, id] = input.data;
  return api<IMeal>(`meal/${id}`, { method: 'PATCH', body });
}

export async function deleteMeal(mealId: string) {
  const input = parseInput(idSchema, mealId);
  if (!input.ok) return input;

  return api(`meal/${input.data}`, { method: 'DELETE' });
}

/** The User's Meals among `ids`, in full; ids not returned are gone. */
export async function fetchMealsByIds(
  ids: string[],
): Promise<TApiResult<IMeal[]>> {
  const input = parseInput(
    z.array(idSchema).min(1).max(MAX_IDS_PER_FETCH),
    ids,
  );
  if (!input.ok) return input;

  const result = await api<IResourcePage<IMeal>>('meal', {
    query: { ids: input.data.join(',') },
  });
  return result.ok ? { ok: true, data: result.data.data } : result;
}
