'use client';

import {
  IResourceList,
  IResourceRecord,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import {
  ResourceSearchPending,
  ResourceSearchProvider,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceSearchProvider';
import {
  getResourceLabels,
  toListQuery,
  toSuspenseKey,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/helpers';

import { DEFAULT_PAGE_SIZE } from '@/app/(modules)/dashboard/(modules)/_resource-table/constants';
import PageHeader from '@/app/components/layout/PageHeader';
import ResourceHeaderActions from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceHeaderActions';
import ResourceList from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceList';
import ResourceListSkeleton from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceListSkeleton';
import ResourceSearch from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceSearch';
import { Suspense } from 'react';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useSearchParams } from 'next/navigation';

interface IProps<TRecord extends IResourceRecord, TFormData> {
  resource: IResourceList<TRecord, TFormData>;
}

/**
 * A whole list page: the header with Compare and Add, the search bar, then a
 * skeleton while loading and the list. The search bar sits outside Suspense
 * so it keeps focus. Reads the URL, so its route renders it inside Suspense.
 */
function ResourcePage<TRecord extends IResourceRecord, TFormData>({
  resource,
}: IProps<TRecord, TFormData>) {
  const dictionary = useDictionary();
  const query = Object.fromEntries(useSearchParams());
  const pageSize = resource.pageSize ?? DEFAULT_PAGE_SIZE;
  const { sort, search } = toListQuery(query, resource.columns, pageSize);
  const labels = getResourceLabels(dictionary, resource.resourceKey);
  const Header = resource.header;
  const Toolbar = resource.toolbar;

  const headerActions = (variant: 'buttons' | 'icon') => (
    <ResourceHeaderActions
      resource={resource}
      compareLabel={labels.compare}
      addLabel={labels.addTitle}
      variant={variant}
    />
  );

  return (
    <>
      <PageHeader
        title={labels.title}
        description={labels.description}
        actions={headerActions('buttons')}
        mobileActions={headerActions('icon')}
      />
      {Header && <Header />}
      <ResourceSearchProvider search={search} sort={sort}>
        {/* Pulls the list up to the header: a list page is one block. */}
        <section className="-mt-2 flex flex-col gap-4 md:-mt-6">
          {(resource.searchable || Toolbar) && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              {resource.searchable && (
                <ResourceSearch resourceKey={resource.resourceKey} />
              )}
              {Toolbar && <Toolbar />}
            </div>
          )}
          <ResourceSearchPending>
            <Suspense
              key={toSuspenseKey(query, resource.columns)}
              fallback={
                <ResourceListSkeleton
                  layout={resource.layout}
                  gridClassName={resource.gridClassName}
                  pageSize={pageSize}
                />
              }
            >
              <ResourceList resource={resource} searchParams={query} />
            </Suspense>
          </ResourceSearchPending>
        </section>
      </ResourceSearchProvider>
    </>
  );
}

export default ResourcePage;
