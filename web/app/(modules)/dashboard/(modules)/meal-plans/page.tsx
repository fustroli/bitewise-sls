'use client';

import ResourcePage from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourcePage';
import { Suspense } from 'react';
import { mealPlanList } from '@/app/(modules)/dashboard/(modules)/meal-plans/resource/list';

// Client: the list config holds functions. Suspense for the URL's query.
export default function Page() {
  return (
    <Suspense>
      <ResourcePage resource={mealPlanList} />
    </Suspense>
  );
}
