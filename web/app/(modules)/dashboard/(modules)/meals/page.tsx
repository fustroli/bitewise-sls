'use client';

import ResourcePage from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourcePage';
import { Suspense } from 'react';
import { mealList } from '@/app/(modules)/dashboard/(modules)/meals/resource/list';

// Client: the list config holds functions. Suspense for the URL's query.
export default function Page() {
  return (
    <Suspense>
      <ResourcePage resource={mealList} />
    </Suspense>
  );
}
