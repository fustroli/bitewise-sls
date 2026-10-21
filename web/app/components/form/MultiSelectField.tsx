'use client';

import { Check, ChevronsUpDown, XIcon } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/app/components/ui/command';
import FieldFrame, {
  FieldControl,
  IFieldProps,
} from '@/app/components/form/FieldFrame';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';

import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { FieldValues } from 'react-hook-form';
import { IOption } from '@/app/utils/interfaces';
import { cn } from '@/app/lib';

interface IProps<T extends FieldValues> extends IFieldProps<T> {
  label: string;
  options: IOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  removeLabel: (option: IOption) => string;
}

/** Picks a set of distinct options; the field value is their `value`s, in the order picked. */
const MultiSelectField = <T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  removeLabel,
}: IProps<T>) => {
  return (
    <FieldFrame control={control} name={name} label={label}>
      {(field) => {
        const selected: number[] = field.value ?? [];

        const toggle = (value: number) =>
          field.onChange(
            selected.includes(value)
              ? selected.filter((item) => item !== value)
              : [...selected, value],
          );

        // In the order picked, not the options' order.
        const selectedOptions = selected.flatMap((value) =>
          options.filter((option) => option.value === value),
        );

        return (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <FieldControl>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {placeholder}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </FieldControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder={searchPlaceholder} />
                  <CommandList>
                    <CommandEmpty>{emptyText}</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={`${option.label}-${option.value}`}
                          onSelect={() => toggle(option.value)}
                        >
                          {option.label}
                          <Check
                            className={cn(
                              'ml-auto',
                              selected.includes(option.value)
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {!!selectedOptions.length && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedOptions.map((option) => (
                  <Badge key={option.value} variant="secondary">
                    {option.label}
                    <button
                      type="button"
                      aria-label={removeLabel(option)}
                      className="ml-2 w-3"
                      onClick={() => toggle(option.value)}
                    >
                      <XIcon className="w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </>
        );
      }}
    </FieldFrame>
  );
};

export default MultiSelectField;
