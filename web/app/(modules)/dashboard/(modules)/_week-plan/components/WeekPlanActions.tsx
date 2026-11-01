'use client';

import { Button, buttonVariants } from '@/app/components/ui/button';
import { Download, Trash2 } from 'lucide-react';

import DeleteDialog from '@/app/components/DeleteDialog';
import { cn } from '@/app/lib';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useWeekPlan } from '@/app/(modules)/dashboard/(modules)/_week-plan/context';

interface IProps {
  /** `icon`: the phone app bar's icon buttons. */
  variant: 'buttons' | 'icon';
}

/** Clear week (confirmed first) and Load meal plan, for the page header. */
const WeekPlanActions = ({ variant }: IProps) => {
  const { weekPlan, draftMealPlan, resourceTable } = useDictionary();
  const { week, clearWeek, openLoad } = useWeekPlan();
  const isIcon = variant === 'icon';
  const clearLabel = weekPlan.clearWeek.button;
  const loadLabel = draftMealPlan.load.button;

  return (
    <>
      <DeleteDialog
        title={weekPlan.clearWeek.title}
        subtitle={weekPlan.clearWeek.confirm}
        triggerLabel={
          <>
            <Trash2 aria-hidden className={cn(isIcon && '!size-5')} />
            <span className={cn(isIcon && 'sr-only')}>{clearLabel}</span>
          </>
        }
        triggerClassName={cn(
          buttonVariants({
            variant: isIcon ? 'ghost' : 'outline',
            size: isIcon ? 'icon' : 'default',
          }),
          'text-destructive hover:text-destructive',
          isIcon && 'size-11',
        )}
        cancelLabel={resourceTable.cancel}
        confirmLabel={clearLabel}
        onConfirm={clearWeek}
      />
      <Button
        type="button"
        size={isIcon ? 'icon' : 'default'}
        className={cn(isIcon && 'size-11')}
        aria-label={isIcon ? loadLabel : undefined}
        disabled={!week}
        onClick={() => openLoad()}
      >
        <Download aria-hidden className={cn(isIcon && '!size-5')} />
        {!isIcon && loadLabel}
      </Button>
    </>
  );
};

export default WeekPlanActions;
