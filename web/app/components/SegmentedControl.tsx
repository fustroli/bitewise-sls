'use client';

import { ToggleGroup, ToggleGroupItem } from '@/app/components/ui/toggle-group';

import { cn } from '@/app/lib';

interface IProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  /** Names the group for screen readers. */
  label: string;
  className?: string;
}

/** Pick one of a few options; the chosen one stays chosen. */
function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: IProps<T>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      // Radix sends '' when the active item is clicked again: keep it.
      onValueChange={(next) => next && onChange(next as T)}
      aria-label={label}
      className={cn('w-fit gap-1 rounded-md bg-muted p-1', className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="h-9 rounded-[7px] px-3.5 text-[13px] font-bold text-secondary-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-card data-[state=on]:font-extrabold data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export default SegmentedControl;
