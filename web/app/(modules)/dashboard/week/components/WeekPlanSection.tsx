'use client';

import { usePrefetchQuery, useSuspenseQuery } from '@tanstack/react-query';

import { PROFILE_SECTION_IDS } from '@/app/(modules)/dashboard/(modules)/_user/constants';
import WeekPlan from '@/app/(modules)/dashboard/(modules)/_week-plan/components/WeekPlan';
import { ingredientOptionsQuery } from '@/app/(modules)/dashboard/(modules)/ingredients/queries';
import { mealOptionsQuery } from '@/app/(modules)/dashboard/(modules)/meals/queries';

/** Loads the Meals and Ingredients the Week plan's days pick from. */
const WeekPlanSection = () => {
  // Both start loading before either suspends.
  usePrefetchQuery(mealOptionsQuery);
  usePrefetchQuery(ingredientOptionsQuery);
  const { data: meals } = useSuspenseQuery(mealOptionsQuery);
  const { data: ingredients } = useSuspenseQuery(ingredientOptionsQuery);

  return (
    <WeekPlan
      options={{ meals, ingredients }}
      bodyStatsHref={`/dashboard/profile#${PROFILE_SECTION_IDS.bodyStats}`}
    />
  );
};

export default WeekPlanSection;
