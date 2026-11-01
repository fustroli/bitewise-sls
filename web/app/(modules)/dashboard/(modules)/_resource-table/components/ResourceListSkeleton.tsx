import { IResourceList } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { Skeleton } from '@/app/components/ui/skeleton';

interface IProps {
  layout: IResourceList<{ id: string; name: string }>['layout'];
  gridClassName?: string;
  pageSize: number;
}

/** A list's shape while it loads: table rows, or cards. */
const ResourceListSkeleton = ({ layout, gridClassName, pageSize }: IProps) => {
  if (layout === 'cards') {
    return (
      <div aria-hidden className={gridClassName}>
        {Array.from({ length: Math.min(pageSize, 6) }, (_, index) => (
          <Skeleton key={index} className="h-[300px] rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div aria-hidden className="overflow-hidden rounded-lg border bg-card">
      <div className="h-12 bg-surface-subtle" />
      {Array.from({ length: pageSize }, (_, index) => (
        <div key={index} className="flex items-center gap-6 border-t px-5 py-4">
          <Skeleton className="h-5 flex-[2]" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 flex-1" />
        </div>
      ))}
    </div>
  );
};

export default ResourceListSkeleton;
