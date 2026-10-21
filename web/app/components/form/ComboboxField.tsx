'use client';

import FieldFrame, {
  FieldControl,
  IFieldProps,
} from '@/app/components/form/FieldFrame';

import Combobox from '@/app/components/form/Combobox';
import { FieldValues } from 'react-hook-form';
import { IOption } from '@/app/utils/interfaces';

interface IProps<T extends FieldValues> extends IFieldProps<T> {
  label: string;
  hideLabel?: boolean;
  options: IOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  /** Overrides the trigger's default 200px width. */
  className?: string;
}

/** Picks one option; the field value is its `value`. */
const ComboboxField = <T extends FieldValues>({
  control,
  name,
  label,
  hideLabel,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
}: IProps<T>) => (
  <FieldFrame control={control} name={name} label={label} hideLabel={hideLabel}>
    {(field) => (
      <FieldControl>
        <Combobox
          value={field.value}
          onChange={field.onChange}
          options={options}
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
          className={className}
        />
      </FieldControl>
    )}
  </FieldFrame>
);

export default ComboboxField;
