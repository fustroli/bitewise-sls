'use client';

import {
  IResourceList,
  IResourceRecord,
  IResourceRowContext,
  TSearchParams,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { Table, TableBody } from '@/app/components/ui/table';
import {
  getResourceLabels,
  toListQuery,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/helpers';
import { usePrefetchQuery, useSuspenseQuery } from '@tanstack/react-query';

import ClearSearchButton from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ClearSearchButton';
import { DEFAULT_PAGE_SIZE } from '@/app/(modules)/dashboard/(modules)/_resource-table/constants';
import EmptyState from '@/app/components/EmptyState';
import { Fragment } from 'react';
import { LOCALE } from '@/app/copy';
import ResourceFooter from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceFooter';
import ResourceTableHead from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceTableHead';
import { interpolate } from '@/app/utils/helpers';
import { noFormDataQuery } from '@/app/(modules)/dashboard/(modules)/_resource-table/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';

interface IProps<TRecord extends IResourceRecord, TFormData> {
  resource: IResourceList<TRecord, TFormData>;
  searchParams: TSearchParams | undefined;
}

/**
 * One page of a resource's records, as a table or a card grid. Suspends
 * until the page and the form data are in, loading both at once.
 */
function ResourceList<TRecord extends IResourceRecord, TFormData>({
  resource,
  searchParams,
}: IProps<TRecord, TFormData>) {
  const dictionary = useDictionary();
  const { dialog: Dialog, rowActions: RowActions, columns } = resource;
  const pageSize = resource.pageSize ?? DEFAULT_PAGE_SIZE;
  const { page, sort, search, params } = toListQuery(
    searchParams,
    columns,
    pageSize,
  );

  const listQuery = resource.listQuery(params);
  const formDataQuery = resource.formDataQuery ?? noFormDataQuery<TFormData>();
  // Both start loading before either suspends.
  usePrefetchQuery(listQuery);
  usePrefetchQuery(formDataQuery);
  const {
    data: { data: rows, count },
  } = useSuspenseQuery(listQuery);
  const { data: formData } = useSuspenseQuery(formDataQuery);

  const labels = getResourceLabels(dictionary, resource.resourceKey);
  const tableLabels = dictionary.resourceTable;

  const context = (row: TRecord): IResourceRowContext => ({
    dictionary,
    labels,
    tableLabels,
    actions: <RowActions record={row} formData={formData} />,
    edit: <Dialog record={row} formData={formData} trigger="outline" />,
    compareHref: `/dashboard/compare?type=${resource.compareType}&ids=${row.id}`,
    lang: LOCALE,
  });

  const empty = search ? (
    <EmptyState
      title={interpolate(labels.noMatch, { term: search })}
      action={<ClearSearchButton />}
    />
  ) : (
    <EmptyState title={labels.empty} />
  );

  const footer = !!rows.length && (
    <ResourceFooter
      page={page}
      pageSize={pageSize}
      total={count}
      shown={rows.length}
      sort={sort}
      search={search}
      labels={tableLabels}
      className={resource.layout === 'table' ? 'border-t px-5 py-3.5' : ''}
    />
  );

  if (resource.layout === 'cards') {
    return (
      <>
        {rows.length ? (
          <ul aria-label={labels.title} className={resource.gridClassName}>
            {rows.map((row) => (
              <li key={row.id} className="flex">
                {resource.renderRow(row, context(row))}
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border bg-card">{empty}</div>
        )}
        {footer}
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {rows.length ? (
        <>
          <div
            className={
              resource.renderMobileRow
                ? 'hidden overflow-x-auto md:block'
                : 'overflow-x-auto'
            }
          >
            <Table aria-label={labels.title} className="min-w-[860px]">
              <ResourceTableHead
                columns={columns}
                labels={labels}
                sort={sort}
                search={search}
                actionsLabel={tableLabels.actions}
              />
              <TableBody>
                {rows.map((row) => (
                  <Fragment key={row.id}>
                    {resource.renderRow(row, context(row))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
          {resource.renderMobileRow && (
            <ul aria-label={labels.title} className="divide-y md:hidden">
              {rows.map((row) => (
                <Fragment key={row.id}>
                  {resource.renderMobileRow!(row, context(row))}
                </Fragment>
              ))}
            </ul>
          )}
        </>
      ) : (
        empty
      )}
      {footer}
    </div>
  );
}

export default ResourceList;
