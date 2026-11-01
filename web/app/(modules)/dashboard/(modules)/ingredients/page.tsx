'use client';

import ResourcePage from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourcePage';
import { Suspense } from 'react';
import { ingredientList } from '@/app/(modules)/dashboard/(modules)/ingredients/resource/list';

// Client: the list config holds functions. Suspense for the URL's query.
export default function Page() {
  return (
    <Suspense>
      <ResourcePage resource={ingredientList} />
    </Suspense>
  );
}
