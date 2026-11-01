'use client';

import DraftActions from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftActions';
import { DraftMealPlanProvider } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/provider';
import DraftMealPlanSection from '@/app/(modules)/dashboard/components/DraftMealPlanSection';
import DraftMealPlanSkeleton from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftMealPlanSkeleton';
import Library from '@/app/(modules)/dashboard/components/Library/Library';
import LibrarySection from '@/app/(modules)/dashboard/components/Library';
import Overview from '@/app/(modules)/dashboard/components/Overview';
import PageHeader from '@/app/components/layout/PageHeader';
import { Suspense } from 'react';
import UserMenuLink from '@/app/(modules)/dashboard/components/UserMenuLink';
import { useDictionary } from '@/app/providers/dictionary-provider';

/**
 * The fetched sections load behind skeletons of their own layout; the
 * Overview reads the User from context, so it renders at once. Suspense
 * catches no errors: a failed load still reaches `error.tsx`. The outer
 * boundary is for the draft provider's `?draft=`.
 */
export default function Page() {
  const { dashboard } = useDictionary();

  return (
    <Suspense fallback={<DraftMealPlanSkeleton />}>
      <DraftMealPlanProvider mealPlansHref="/dashboard/meal-plans">
        <PageHeader
          title={dashboard.sidebar.dashboard}
          description={dashboard.description}
          actions={<DraftActions />}
          mobileActions={<UserMenuLink />}
        />
        <Overview
          afterSummary={
            <Suspense fallback={<DraftMealPlanSkeleton />}>
              <DraftMealPlanSection />
            </Suspense>
          }
        />
        <Suspense fallback={<Library />}>
          <LibrarySection />
        </Suspense>
      </DraftMealPlanProvider>
    </Suspense>
  );
}
