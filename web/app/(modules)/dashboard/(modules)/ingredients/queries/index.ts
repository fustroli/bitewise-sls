import {
  ICreateIngredient,
  IIngredient,
  IIngredientOption,
} from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import { IQueryParams, TApiResult } from '@/app/utils/interfaces';
import { api, unwrap } from '@/app/lib/api';
import { idSchema, parseInput } from '@/app/utils/helpers';

import { IResourcePage } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { MAX_IDS_PER_FETCH } from '@/app/utils/constants';
import { QUERY_KEYS } from '@/app/(modules)/dashboard/(modules)/_resource-table/constants';
import { createIngredientSchema } from '@bitewise/shared';
import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

export const ingredientListQuery = (params: IQueryParams) =>
  queryOptions({
    queryKey: [...QUERY_KEYS.ingredients, 'list', params],
    queryFn: async () =>
      unwrap(
        await api<IResourcePage<IIngredient>>('ingredient', { query: params }),
      ),
  });

/** Every Ingredient of the User, by name, as a picker offers them. */
export const ingredientOptionsQuery = queryOptions({
  queryKey: [...QUERY_KEYS.ingredients, 'options'],
  queryFn: async () =>
    unwrap(await api<IIngredientOption[]>('ingredient/options')),
});

export async function createIngredient(ingredient: ICreateIngredient) {
  const input = parseInput(createIngredientSchema, ingredient);
  if (!input.ok) return input;

  return api<IIngredient>('ingredient', { method: 'POST', body: input.data });
}

export async function updateIngredient(
  ingredient: ICreateIngredient,
  ingredientId: string,
) {
  // The form always sends the whole Ingredient.
  const input = parseInput(z.tuple([createIngredientSchema, idSchema]), [
    ingredient,
    ingredientId,
  ]);
  if (!input.ok) return input;

  const [body, id] = input.data;
  return api<IIngredient>(`ingredient/${id}`, { method: 'PATCH', body });
}

export async function deleteIngredient(ingredientId: string) {
  const input = parseInput(idSchema, ingredientId);
  if (!input.ok) return input;

  return api(`ingredient/${input.data}`, { method: 'DELETE' });
}

/** The User's Ingredients among `ids`, in full; ids not returned are gone. */
export async function fetchIngredientsByIds(
  ids: string[],
): Promise<TApiResult<IIngredient[]>> {
  const input = parseInput(
    z.array(idSchema).min(1).max(MAX_IDS_PER_FETCH),
    ids,
  );
  if (!input.ok) return input;

  const result = await api<IResourcePage<IIngredient>>('ingredient', {
    query: { ids: input.data.join(',') },
  });
  return result.ok ? { ok: true, data: result.data.data } : result;
}
