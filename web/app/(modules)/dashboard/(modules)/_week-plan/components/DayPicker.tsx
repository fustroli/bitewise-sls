'use client';

import { ToggleGroup, ToggleGroupItem } from '@/app/components/ui/toggle-group';

import { useId } from 'react';

interface IProps {
  label: string;
  /** Monday to Sunday. */
  names: string[];
  value: number[];
  onChange: (days: number[]) => void;
  /** A day that can't be picked, e.g. the one being copied. */
  disabledDay?: number;
}

/** Picks any of the week's days, each a toggle chip. */
const DayPicker = ({ label, names, value, onChange, disabledDay }: IProps) => {
  const labelId = useId();

  return (
    <div className="flex flex-col gap-2">
      <p id={labelId} className="text-sm font-medium">
        {label}
      </p>
      <ToggleGroup
        type="multiple"
        aria-labelledby={labelId}
        value={value.map(String)}
        onValueChange={(days) => onChange(days.map(Number))}
        className="flex-wrap justify-start gap-1.5"
      >
        {names.map((name, day) => (
          <ToggleGroupItem
            key={name}
            value={String(day)}
            disabled={day === disabledDay}
            className="h-10 min-w-14 rounded-full border bg-card px-3 text-[13px] font-extrabold disabled:border-dashed data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default DayPicker;
