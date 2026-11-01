import { ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import {
  IResourceColumn,
  IResourceLabels,
  ISortState,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { TableHead, TableHeader, TableRow } from '@/app/components/ui/table';

import { EOrderDirection } from '@/app/utils/enums';
import Link from 'next/link';
import { MacroSwatch } from '@/app/components/nutrition/MacroLegend';
import { buildSortHref } from '@/app/(modules)/dashboard/(modules)/_resource-table/helpers';
import { cn } from '@/app/lib';

interface IProps {
  columns: IResourceColumn[];
  labels: IResourceLabels;
  sort: ISortState;
  search?: string;
  /** Names the actions column for screen readers. */
  actionsLabel: string;
}

const ResourceTableHead = ({
  columns,
  labels,
  sort,
  search,
  actionsLabel,
}: IProps) => {
  const Icon =
    sort.orderDirection === EOrderDirection.ASC ? ArrowDownAZ : ArrowUpAZ;

  return (
    <TableHeader className="bg-surface-subtle">
      <TableRow className="hover:bg-transparent">
        {columns.map((column, index) => {
          const isActive = column.id === sort.orderBy;
          const className = cn(
            'flex items-center gap-1.5',
            column.align,
            isActive && 'text-primary',
          );
          const content = (
            <>
              {column.swatch && <MacroSwatch macro={column.swatch} />}
              {labels.columns[column.id]}
              {isActive && <Icon aria-hidden size={14} />}
            </>
          );

          return (
            <TableHead
              key={column.id}
              aria-sort={
                isActive
                  ? sort.orderDirection === EOrderDirection.DESC
                    ? 'descending'
                    : 'ascending'
                  : undefined
              }
              className={cn(
                'h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-secondary-foreground',
                index === 0 && 'pl-5',
              )}
            >
              {column.sortable ? (
                <Link
                  href={buildSortHref(sort, column.id, search)}
                  className={cn(
                    className,
                    'rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  {content}
                </Link>
              ) : (
                <span className={className}>{content}</span>
              )}
            </TableHead>
          );
        })}
        <TableHead className="w-16">
          <span className="sr-only">{actionsLabel}</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ResourceTableHead;
