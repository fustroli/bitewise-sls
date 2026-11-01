'use client';

import {
  IDraftRecords,
  IDraftSources,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/interfaces';
import { useCallback, useMemo } from 'react';

import { EDraftLineKind } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/enums';
import { TDraftLine } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import { draftItemIds } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/helpers';
import { fetchIngredientsByIds } from '@/app/(modules)/dashboard/(modules)/ingredients/queries';
import { fetchMealsByIds } from '@/app/(modules)/dashboard/(modules)/meals/queries';
import { toastResult } from '@/app/utils/helpers/client';
import { useRecordCache } from '@/app/hooks/use-record-cache';

/**
 * The full Meals and Ingredients that draft lines pick, fetched by id as
 * lines need them: once each, for the life of the component holding it.
 */
export const useDraftRecords = (): IDraftRecords => {
  const meals = useRecordCache(fetchMealsByIds, toastResult);
  const ingredients = useRecordCache(fetchIngredientsByIds, toastResult);
  const { request: requestMeals, retry: retryMeals } = meals;
  const { request: requestIngredients, retry: retryIngredients } = ingredients;

  const sources = useMemo<IDraftSources>(
    () => ({
      meals: meals.records,
      ingredients: ingredients.records,
      missing: { meals: meals.missing, ingredients: ingredients.missing },
    }),
    [meals.records, meals.missing, ingredients.records, ingredients.missing],
  );

  const request = useCallback(
    (lines: TDraftLine[]) => {
      requestMeals(draftItemIds(lines, EDraftLineKind.MEAL));
      requestIngredients(draftItemIds(lines, EDraftLineKind.INGREDIENT));
    },
    [requestMeals, requestIngredients],
  );

  const retry = useCallback(() => {
    retryMeals();
    retryIngredients();
  }, [retryMeals, retryIngredients]);

  return {
    sources,
    request,
    hasFailed: meals.failed.length + ingredients.failed.length > 0,
    retry,
  };
};
