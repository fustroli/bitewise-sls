import { ReactNode } from 'react';
import { cn } from '@/app/lib';

interface IProps {
  /** Visible above the value; leave out where a column header names it. */
  name?: ReactNode;
  /** Formatted amount, e.g. "28.2". */
  value: string;
  unit?: string;
  /** Muted line under it, e.g. "sugar 0.1 g". */
  sub?: string;
  align?: 'start' | 'end';
  className?: string;
}

/** An amount in bold with its unit, and an optional muted detail below. */
const MacroValue = ({
  name,
  value,
  unit = 'g',
  sub,
  align = 'start',
  className,
}: IProps) => (
  <div
    className={cn(
      'flex flex-col gap-0.5',
      align === 'end' ? 'items-end text-right' : 'items-start',
      className,
    )}
  >
    {name && (
      <span className="text-xs font-bold text-muted-foreground">{name}</span>
    )}
    <span>
      <strong className="font-bold">{value}</strong>{' '}
      <span className="text-[13px] text-muted-foreground">{unit}</span>
    </span>
    {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
  </div>
);

export default MacroValue;
