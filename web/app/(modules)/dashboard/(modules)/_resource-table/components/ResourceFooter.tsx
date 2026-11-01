import { Button } from '@/app/components/ui/button';
import { FIRST_PAGE } from '@/app/utils/constants';
import { ISortState } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import Link from 'next/link';
import { ReactNode } from 'react';
import { TDictionary } from '@/app/providers/dictionary-provider';
import { buildPageHref } from '@/app/(modules)/dashboard/(modules)/_resource-table/helpers';
import { cn } from '@/app/lib';
import { interpolate } from '@/app/utils/helpers';

interface IProps {
  page: number;
  pageSize: number;
  total: number;
  /** Rows on this page. */
  shown: number;
  sort: ISortState;
  search?: string;
  labels: TDictionary['resourceTable'];
  className?: string;
}

/** "Showing 1–20 of 34" and Previous / Next. */
const ResourceFooter = ({
  page,
  pageSize,
  total,
  shown,
  sort,
  search,
  labels,
  className,
}: IProps) => {
  const from = (page - FIRST_PAGE) * pageSize + 1;
  const hasPrevious = page > FIRST_PAGE;
  const hasNext = page * pageSize < total;

  const pageLink = (
    target: number,
    enabled: boolean,
    label: string,
    text: ReactNode,
  ) =>
    enabled ? (
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-10 px-3.5 text-sm"
      >
        <Link href={buildPageHref(target, sort, search)} aria-label={label}>
          {text}
        </Link>
      </Button>
    ) : (
      <Button
        variant="outline"
        size="sm"
        className="h-10 px-3.5 text-sm"
        disabled
      >
        {text}
      </Button>
    );

  return (
    <nav
      aria-label={labels.pagination}
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground',
        className,
      )}
    >
      <span>
        {interpolate(labels.showing, {
          from,
          to: from + shown - 1,
          total,
        })}
      </span>
      <div className="flex gap-2">
        {pageLink(page - 1, hasPrevious, labels.previousPage, labels.previous)}
        {pageLink(page + 1, hasNext, labels.nextPage, labels.next)}
      </div>
    </nav>
  );
};

export default ResourceFooter;
