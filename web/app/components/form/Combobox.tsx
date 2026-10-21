'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/app/components/ui/command';
import { ComponentPropsWithRef, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';

import { Button } from '@/app/components/ui/button';
import { IOption } from '@/app/utils/interfaces';
import { cn } from '@/app/lib';

interface IProps extends Omit<
  ComponentPropsWithRef<typeof Button>,
  'value' | 'onChange'
> {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  options: IOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  /** Adds a first option that picks `null`. */
  noneLabel?: string;
}

/**
 * A searchable single-option picker, not bound to a form. Other props
 * (`id`, `aria-*`, `ref`, `className`) go to the trigger button; its default
 * width is 200px.
 */
const Combobox = ({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  noneLabel,
  className,
  ...triggerProps
}: IProps) => {
  const [open, setOpen] = useState(false);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    (value === null ? noneLabel : undefined);

  const pick = (next: number | null) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          title={selectedLabel}
          className={cn('w-[200px] justify-between', className)}
          {...triggerProps}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[200px] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {noneLabel !== undefined && (
                <CommandItem onSelect={() => pick(null)}>
                  {noneLabel}
                  <Check
                    className={cn(
                      'ml-auto',
                      value === null ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => pick(option.value)}
                >
                  {option.label}
                  <Check
                    className={cn(
                      'ml-auto',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default Combobox;
