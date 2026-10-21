'use client';

import Library from '@/app/(modules)/dashboard/components/Library/Library';
import LibrarySection from '@/app/(modules)/dashboard/components/Library';
import Overview from '@/app/(modules)/dashboard/components/Overview';
import PageHeader from '@/app/components/layout/PageHeader';
import { Suspense } from 'react';
import UserMenuLink from '@/app/(modules)/dashboard/components/UserMenuLink';
import { useDictionary } from '@/app/providers/dictionary-provider';

/**
 * The Overview reads the User from context, so it renders at once; the
 * library counts load behind a skeleton of their own layout. Suspense
 * catches no errors: a failed load still reaches `error.tsx`.
 */
export default function Page() {
  const { dashboard } = useDictionary();

  return (
    <>
      <PageHeader
        title={dashboard.sidebar.dashboard}
        description={dashboard.description}
        mobileActions={<UserMenuLink />}
      />
      <Overview />
      <Suspense fallback={<Library />}>
        <LibrarySection />
      </Suspense>
    </>
  );
}
