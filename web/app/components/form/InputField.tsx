import FieldFrame, {
  FieldControl,
  IFieldProps,
} from '@/app/components/form/FieldFrame';
import { FieldValues, PathValue } from 'react-hook-form';
import { FocusEvent, HTMLInputTypeAttribute, ReactNode, Ref } from 'react';

import { Input } from '@/app/components/ui/input';
import { cn } from '@/app/lib/utils';

interface IProps<T extends FieldValues> extends IFieldProps<T> {
  label?: string;
  hideLabel?: boolean;
  type?: HTMLInputTypeAttribute;
  /** For a number field; the schema still does the validating. */
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  endAdornment?: ReactNode;
  /** Called after React Hook Form's own blur handler. */
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  ref?: Ref<HTMLInputElement>;
}

const InputField = <T extends FieldValues>({
  control,
  name,
  label,
  hideLabel,
  type = 'text',
  min,
  max,
  step,
  disabled,
  endAdornment,
  onBlur,
  ref,
}: IProps<T>) => (
  <FieldFrame
    control={control}
    name={name}
    label={label}
    hideLabel={hideLabel}
    adornment={endAdornment}
  >
    {(field) => (
      <FieldControl>
        <Input
          type={type}
          name={field.name}
          value={field.value ?? ''}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(endAdornment && 'pr-10')}
          ref={(element) => {
            field.ref(element);
            if (typeof ref === 'function') {
              ref(element);
            } else if (ref) {
              ref.current = element;
            }
          }}
          onBlur={(event) => {
            field.onBlur();
            onBlur?.(event);
          }}
          onChange={(event) =>
            field.onChange(
              (type === 'number'
                ? // An emptied number field is missing, not 0. `null`, not
                  // `undefined`: React Hook Form would show the default again.
                  event.target.value === ''
                  ? null
                  : event.target.valueAsNumber
                : event.target.value) as PathValue<T, typeof name>,
            )
          }
        />
      </FieldControl>
    )}
  </FieldFrame>
);

export default InputField;
