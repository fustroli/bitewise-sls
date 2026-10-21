'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useState } from 'react';

export interface IBandRow {
  key: string;
  label: string;
  range: string;
  current: boolean;
}

interface IProps {
  rows: IBandRow[];
  showLabel: string;
  hideLabel: string;
  /** Names the table for screen readers. */
  caption: string;
}

/** A reference table behind a disclosure button, the User's row marked. */
const BandTable = ({ rows, showLabel, hideLabel, caption }: IProps) => {
  const you = useDictionary().dashboard.bodyMetrics.you;
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col">
      <CollapsibleTrigger className="flex min-h-10 items-center gap-1.5 self-start rounded-md px-1 text-sm font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {open ? hideLabel : showLabel}
        <ChevronDown
          aria-hidden
          className={cn(
            'size-4 transition-transform motion-reduce:transition-none',
            open && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <table className="mt-2 w-full overflow-hidden rounded-md border text-sm">
          <caption className="sr-only">{caption}</caption>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                aria-current={row.current || undefined}
                className={cn(
                  'border-t first:border-t-0',
                  row.current &&
                    'bg-accent font-extrabold text-accent-foreground',
                )}
              >
                <th
                  scope="row"
                  className="px-3.5 py-2.5 text-left font-[inherit]"
                >
                  {row.current
                    ? interpolate(you, { label: row.label })
                    : row.label}
                </th>
                <td
                  className={cn(
                    'px-3.5 py-2.5 text-right',
                    !row.current && 'text-muted-foreground',
                  )}
                >
                  {row.range}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default BandTable;
