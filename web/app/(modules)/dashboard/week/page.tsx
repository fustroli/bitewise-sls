'use client';

import PageHeader from '@/app/components/layout/PageHeader';
import PlansSwitch from '@/app/(modules)/dashboard/(modules)/meal-plans/components/PlansSwitch';
import { Suspense } from 'react';
import WeekPlanActions from '@/app/(modules)/dashboard/(modules)/_week-plan/components/WeekPlanActions';
import { WeekPlanProvider } from '@/app/(modules)/dashboard/(modules)/_week-plan/provider';
import WeekPlanSection from '@/app/(modules)/dashboard/week/components/WeekPlanSection';
import WeekPlanSkeleton from '@/app/(modules)/dashboard/(modules)/_week-plan/components/WeekPlanSkeleton';
import { useDictionary } from '@/app/providers/dictionary-provider';

/** The Week plan: kept in this browser, its Meals and Ingredients fetched. */
export default function Page() {
  const { weekPlan } = useDictionary();

  return (
    // The provider reads `?load=`, so it renders inside Suspense too.
    <Suspense fallback={<WeekPlanSkeleton />}>
      <WeekPlanProvider mealPlansHref="/dashboard/meal-plans">
        <PageHeader
          title={weekPlan.title}
          description={weekPlan.description}
          actions={<WeekPlanActions variant="buttons" />}
          mobileActions={<WeekPlanActions variant="icon" />}
        />
        <PlansSwitch />
        <Suspense fallback={<WeekPlanSkeleton />}>
          <WeekPlanSection />
        </Suspense>
      </WeekPlanProvider>
    </Suspense>
  );
}
