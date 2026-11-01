import { Skeleton } from '@/app/components/ui/skeleton';

/**
 * Stands in for the Draft meal plan while its sources load and until the
 * client has read the stored draft. Phone width only: without a draft, a
 * desktop dashboard shows nothing here.
 */
const DraftMealPlanSkeleton = () => (
  <Skeleton className="h-[136px] w-full rounded-lg md:hidden" />
);

export default DraftMealPlanSkeleton;
