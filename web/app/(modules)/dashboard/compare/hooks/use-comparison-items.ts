'use client';

import { IRecordCache, useRecordCache } from '@/app/hooks/use-record-cache';
import {
  ingredientItem,
  mealItem,
  mealPlanItem,
} from '@/app/(modules)/dashboard/(modules)/_comparison/helpers';

import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import { IComparisonItem } from '@/app/(modules)/dashboard/(modules)/_comparison/interfaces';
import { TApiResult } from '@/app/utils/interfaces';
import { fetchIngredientsByIds } from '@/app/(modules)/dashboard/(modules)/ingredients/queries';
import { fetchMealPlansByIds } from '@/app/(modules)/dashboard/(modules)/meal-plans/queries';
import { fetchMealsByIds } from '@/app/(modules)/dashboard/(modules)/meals/queries';
import { toastResult } from '@/app/utils/helpers/client';

const asItems =
  <T>(
    fetchByIds: (ids: string[]) => Promise<TApiResult<T[]>>,
    toItem: (record: T) => IComparisonItem,
  ) =>
  async (ids: string[]): Promise<TApiResult<IComparisonItem[]>> => {
    const result = await fetchByIds(ids);
    return result.ok ? { ok: true, data: result.data.map(toItem) } : result;
  };

const FETCH_ITEMS = {
  [EComparisonKind.INGREDIENTS]: asItems(fetchIngredientsByIds, ingredientItem),
  [EComparisonKind.MEALS]: asItems(fetchMealsByIds, mealItem),
  [EComparisonKind.MEAL_PLANS]: asItems(fetchMealPlansByIds, mealPlanItem),
};

/**
 * Each kind's compared records, fetched by id as they're picked and kept
 * while switching kinds.
 */
export const useComparisonItems = (): Record<
  EComparisonKind,
  IRecordCache<IComparisonItem>
> => ({
  [EComparisonKind.INGREDIENTS]: useRecordCache(
    FETCH_ITEMS[EComparisonKind.INGREDIENTS],
    toastResult,
  ),
  [EComparisonKind.MEALS]: useRecordCache(
    FETCH_ITEMS[EComparisonKind.MEALS],
    toastResult,
  ),
  [EComparisonKind.MEAL_PLANS]: useRecordCache(
    FETCH_ITEMS[EComparisonKind.MEAL_PLANS],
    toastResult,
  ),
});
