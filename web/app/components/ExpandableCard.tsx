'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible';
import { ReactNode, useState } from 'react';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib';

interface IProps {
  /** The always-visible body of the card. */
  header: ReactNode;
  /** The footer button's text while shut, e.g. "Show 4 ingredients". */
  showLabel: string;
  /** Its text while open, e.g. "Hide ingredients". */
  hideLabel: string;
  /** Revealed under the footer button. */
  children: ReactNode;
  className?: string;
}

/** A card whose full-width footer button reveals a list. */
const ExpandableCard = ({
  header,
  showLabel,
  hideLabel,
  children,
  className,
}: IProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border bg-card',
        className,
      )}
    >
      <div className="flex-1">{header}</div>
      <CollapsibleTrigger className="flex min-h-12 w-full items-center justify-between gap-2 border-t px-5 text-sm font-bold text-primary transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        {open ? hideLabel : showLabel}
        <ChevronDown
          aria-hidden
          className={cn(
            'size-4 transition-transform motion-reduce:transition-none',
            open && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
};

export default ExpandableCard;
