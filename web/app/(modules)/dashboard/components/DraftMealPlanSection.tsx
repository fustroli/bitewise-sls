'use client';

import { usePrefetchQuery, useSuspenseQuery } from '@tanstack/react-query';

import DraftMealPlan from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftMealPlan';
import { PROFILE_SECTION_IDS } from '@/app/(modules)/dashboard/(modules)/_user/constants';
import { ingredientOptionsQuery } from '@/app/(modules)/dashboard/(modules)/ingredients/queries';
import { mealOptionsQuery } from '@/app/(modules)/dashboard/(modules)/meals/queries';

/** Loads the Meals and Ingredients the Draft meal plan picks from. */
const DraftMealPlanSection = () => {
  // Both start loading before either suspends.
  usePrefetchQuery(mealOptionsQuery);
  usePrefetchQuery(ingredientOptionsQuery);
  const { data: meals } = useSuspenseQuery(mealOptionsQuery);
  const { data: ingredients } = useSuspenseQuery(ingredientOptionsQuery);

  return (
    <DraftMealPlan
      options={{ meals, ingredients }}
      profileHref={`/dashboard/profile#${PROFILE_SECTION_IDS.bodyStats}`}
    />
  );
};

export default DraftMealPlanSection;
