'use client';

import { Suspense, useMemo } from 'react';
import { usePrefetchQuery, useSuspenseQuery } from '@tanstack/react-query';

import ComparePage from '@/app/(modules)/dashboard/compare/components/ComparePage';
import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import { ingredientOptionsQuery } from '@/app/(modules)/dashboard/(modules)/ingredients/queries';
import { mealOptionsQuery } from '@/app/(modules)/dashboard/(modules)/meals/queries';
import { mealPlanOptionsQuery } from '@/app/(modules)/dashboard/(modules)/meal-plans/queries';
import { parseComparisonQuery } from '@/app/(modules)/dashboard/(modules)/_comparison/helpers';
import { useSearchParams } from 'next/navigation';

/**
 * Loads every kind's options, so switching kinds keeps each kind's picks;
 * the picks themselves are fetched as they're made (the URL's first).
 */
function Compare() {
  const searchParams = useSearchParams();
  const initial = useMemo(
    () =>
      parseComparisonQuery({
        type: searchParams.get('type') ?? undefined,
        ids: searchParams.get('ids') ?? undefined,
      }),
    // Read once: the page keeps its own state and writes the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // All start loading before any suspends.
  usePrefetchQuery(ingredientOptionsQuery);
  usePrefetchQuery(mealOptionsQuery);
  usePrefetchQuery(mealPlanOptionsQuery);
  const { data: ingredients } = useSuspenseQuery(ingredientOptionsQuery);
  const { data: meals } = useSuspenseQuery(mealOptionsQuery);
  const { data: mealPlans } = useSuspenseQuery(mealPlanOptionsQuery);

  return (
    <ComparePage
      initial={initial}
      options={{
        [EComparisonKind.INGREDIENTS]: ingredients,
        [EComparisonKind.MEALS]: meals,
        [EComparisonKind.MEAL_PLANS]: mealPlans,
      }}
    />
  );
}

export default function Page() {
  return (
    <Suspense>
      <Compare />
    </Suspense>
  );
}
