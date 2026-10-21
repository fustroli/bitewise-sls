import FieldFrame, {
  FieldControl,
  IFieldProps,
} from '@/app/components/form/FieldFrame';
import { FieldValues, PathValue } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

import { PropsWithChildren } from 'react';

/** Radix items can't have an empty value, so clearing has its own. */
const CLEAR_VALUE = '__clear__';

interface IProps<T extends FieldValues>
  extends IFieldProps<T>, PropsWithChildren {
  label?: string;
  placeholder: string;
  /** Adds an option, with this label, that sets the field to `null`. */
  clearLabel?: string;
}

const SelectField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  clearLabel,
  children,
}: IProps<T>) => (
  <FieldFrame control={control} name={name} label={label}>
    {(field) => (
      <Select
        value={field.value ?? ''}
        onValueChange={(value) =>
          field.onChange(
            (value === CLEAR_VALUE ? null : value) as PathValue<T, typeof name>,
          )
        }
      >
        <FieldControl>
          <SelectTrigger onBlur={field.onBlur}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
        </FieldControl>
        <SelectContent>
          {children}
          {clearLabel && (
            <>
              <SelectSeparator />
              <SelectItem value={CLEAR_VALUE}>{clearLabel}</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    )}
  </FieldFrame>
);

export default SelectField;
