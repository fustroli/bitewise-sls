'use client';

import { TriangleAlert } from 'lucide-react';
import { cn } from '@/app/lib';
import { formatCalories } from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';

interface IProps {
  /** The safe minimum for the User's sex, in kcal/day. */
  safeMinimum: number;
  locale: string;
  /** `span` inside another paragraph. */
  as?: 'p' | 'span';
  className?: string;
}

/** Warns that a Calorie target is below the safe minimum. */
const BelowSafeMinimum = ({
  safeMinimum,
  locale,
  as = 'p',
  className,
}: IProps) => {
  const labels = useDictionary().dashboard.bodyMetrics.calories;
  const Tag = as;

  return (
    <Tag
      className={cn(
        'flex items-center gap-2 text-xs font-semibold text-destructive md:text-[13px]',
        className,
      )}
    >
      <TriangleAlert aria-hidden className="size-4 shrink-0" />
      {interpolate(labels.belowSafeMinimum, {
        min: formatCalories(safeMinimum, locale),
      })}
    </Tag>
  );
};

export default BelowSafeMinimum;
