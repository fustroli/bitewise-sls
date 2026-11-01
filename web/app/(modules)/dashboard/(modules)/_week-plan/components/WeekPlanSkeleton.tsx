import { DAYS_PER_WEEK } from '@/app/(modules)/dashboard/(modules)/_week-plan/constants';
import { Skeleton } from '@/app/components/ui/skeleton';

/** Stands in for the week while its sources load and until the client has read it. */
const WeekPlanSkeleton = () => (
  <div className="flex flex-col gap-8 md:gap-12">
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      <Skeleton className="h-[120px] rounded-lg" />
      <Skeleton className="h-[120px] rounded-lg" />
    </div>
    <div className="grid grid-cols-7 gap-1 md:gap-2">
      {Array.from({ length: DAYS_PER_WEEK }, (_, day) => (
        <Skeleton key={day} className="h-14 rounded-md md:h-[104px]" />
      ))}
    </div>
    <Skeleton className="h-[360px] rounded-lg" />
  </div>
);

export default WeekPlanSkeleton;
