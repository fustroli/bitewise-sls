import { FieldValues, Path } from 'react-hook-form';

interface IProfileFieldBase<TValues extends FieldValues> {
  name: Path<TValues>;
  label?: string;
  /** Fields with the same group are read under its heading. */
  group?: string;
  /** Read instead of "Not set" when the value is empty. */
  emptyText?: string;
}

interface IProfileTextField<
  TValues extends FieldValues,
> extends IProfileFieldBase<TValues> {
  kind: 'text' | 'email';
  /** Applied to the input's value when it loses focus. */
  normalize?: (value: string) => string;
}

interface IProfilePhoneOrDateField<
  TValues extends FieldValues,
> extends IProfileFieldBase<TValues> {
  kind: 'phone' | 'date';
}

interface IProfileNumberField<
  TValues extends FieldValues,
> extends IProfileFieldBase<TValues> {
  kind: 'number';
  min: number;
  max: number;
  step: number;
  /** Read after the value, and shown in the input, e.g. `cm`. */
  unit?: string;
  /** Shown under the label while editing. */
  hint?: string;
}

export interface IProfileSelectOption {
  value: string;
  label: string;
}

interface IProfileSelectField<
  TValues extends FieldValues,
> extends IProfileFieldBase<TValues> {
  kind: 'select';
  options: IProfileSelectOption[];
  placeholder: string;
  /** Label of the option that unsets the field. */
  clearLabel: string;
}

interface IProfileSwitchField<
  TValues extends FieldValues,
> extends IProfileFieldBase<TValues> {
  kind: 'switch';
  label: string;
  description: string;
  disabled?: boolean;
}

/** One field of a Profile section: how it reads, and how it is edited. */
export type TProfileField<TValues extends FieldValues> =
  | IProfileTextField<TValues>
  | IProfilePhoneOrDateField<TValues>
  | IProfileNumberField<TValues>
  | IProfileSelectField<TValues>
  | IProfileSwitchField<TValues>;
