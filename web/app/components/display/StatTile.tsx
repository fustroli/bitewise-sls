import Chip from '@/app/components/display/Chip';
import { ReactNode } from 'react';

interface IProps {
  label: string;
  value: ReactNode;
  unit?: string;
  /** An accent chip after the value, e.g. a category. */
  badge?: string;
  hint?: ReactNode;
}

/** One headline number of a summary row. */
const StatTile = ({ label, value, unit, badge, hint }: IProps) => (
  <div className="flex flex-col gap-2.5 rounded-lg border bg-card p-4 md:p-5">
    <p className="text-[13px] font-bold text-muted-foreground">{label}</p>
    <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span className="text-[26px] font-extrabold leading-none tracking-tight md:text-[32px]">
        {value}
      </span>
      {unit && (
        <span className="text-sm font-semibold text-muted-foreground">
          {unit}
        </span>
      )}
      {badge && <Chip className="self-center">{badge}</Chip>}
    </p>
    {hint && <p className="text-[13px] text-muted-foreground">{hint}</p>}
  </div>
);

export default StatTile;
