import { ReactNode } from 'react';
import { cn } from '@/app/lib';
import { progressPercent } from '@/app/utils/helpers';

interface IProps {
  label: ReactNode;
  value: number;
  target: number;
  /** Formatted value, e.g. "142". */
  valueText: string;
  /** Formatted target with its unit, e.g. "/ 129 g". */
  targetText: string;
  /** The bar's `bg-*` class. */
  barClassName: string;
  /** Under the bar, e.g. "On target (+40 kcal)". */
  note?: ReactNode;
}

/** A value against its target, with a thin bar capped at 100%. */
const ProgressVsTarget = ({
  label,
  value,
  target,
  valueText,
  targetText,
  barClassName,
  note,
}: IProps) => (
  <div className="flex min-w-0 flex-col gap-2">
    <div className="text-[13px] font-bold text-muted-foreground">{label}</div>
    <p className="flex items-baseline gap-1">
      <span className="text-lg font-extrabold">{valueText}</span>
      <span className="text-[13px] text-muted-foreground">{targetText}</span>
    </p>
    <div className="h-1.5 rounded-full bg-muted">
      <div
        className={cn('h-full rounded-full', barClassName)}
        style={{ width: `${progressPercent(value, target)}%` }}
      />
    </div>
    {note && <div className="text-xs text-muted-foreground">{note}</div>}
  </div>
);

export default ProgressVsTarget;
