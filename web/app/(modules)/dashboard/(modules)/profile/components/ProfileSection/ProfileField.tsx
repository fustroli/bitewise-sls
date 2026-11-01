'use client';

import { FieldValues, PathValue, UseFormReturn } from 'react-hook-form';

import DatePicker from '@/app/components/form/DatePicker';
import InputField from '@/app/components/form/InputField';
import SelectField from '@/app/components/form/Select';
import { SelectItem } from '@/app/components/ui/select';
import SwitchFormField from '@/app/components/form/SwitchFormField';
import type TPhoneInput from '@/app/(modules)/dashboard/(modules)/profile/components/ProfileSection/PhoneInput';
import { TProfileField } from '@/app/(modules)/dashboard/(modules)/profile/interfaces';
import { cn } from '@/app/lib';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';

/**
 * Edit-mode only, so libphonenumber loads lazily. Its box below has a fixed
 * height, so there's no jump when it arrives. The cast keeps the generic props.
 */
const PhoneInput = dynamic(
  () =>
    import('@/app/(modules)/dashboard/(modules)/profile/components/ProfileSection/PhoneInput'),
  { ssr: false },
) as typeof TPhoneInput;

interface IReadProps<TValues extends FieldValues> {
  field: TProfileField<TValues>;
  /** The saved value. */
  value: unknown;
  /** What an empty value reads as, unless the field has its own. */
  notSet: string;
}

const isEmpty = (value: unknown) =>
  value === undefined || value === null || value === '';

const readText = <TValues extends FieldValues>(
  field: TProfileField<TValues>,
  value: unknown,
) => {
  if (field.kind === 'date') return format(value as Date, 'PPP');
  if (field.kind === 'select') {
    return field.options.find((option) => option.value === value)?.label;
  }
  if (field.kind === 'number' && field.unit) return `${value} ${field.unit}`;
  return String(value);
};

/**
 * A field's saved value as a label/value pair: side by side on a phone,
 * stacked in a grid cell from `md` up. Empty reads as muted italics.
 */
export const ProfileFieldValue = <TValues extends FieldValues>({
  field,
  value,
  notSet,
}: IReadProps<TValues>) => {
  const empty = isEmpty(value);

  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-t px-4 py-2 first:border-t-0 md:flex-col md:items-start md:justify-start md:gap-1 md:border-t-0 md:px-6 md:py-[18px]">
      <dt className="text-[13px] font-bold text-muted-foreground">
        {field.label}
      </dt>
      <dd
        className={cn(
          'break-words text-right text-[15px] md:text-left',
          empty ? 'italic text-muted-foreground' : 'font-bold',
        )}
      >
        {empty ? (field.emptyText ?? notSet) : readText(field, value)}
      </dd>
    </div>
  );
};

interface IEditProps<TValues extends FieldValues> {
  field: Exclude<TProfileField<TValues>, { kind: 'switch' }>;
  form: UseFormReturn<TValues>;
}

/** A field's input while its section is being edited. */
export const ProfileFieldInput = <TValues extends FieldValues>({
  field,
  form,
}: IEditProps<TValues>) => {
  switch (field.kind) {
    case 'date':
      return (
        <DatePicker
          control={form.control}
          name={field.name}
          label={field.label}
        />
      );
    case 'number':
      return (
        <div className="flex flex-col gap-1">
          <InputField
            control={form.control}
            name={field.name}
            label={field.label}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            endAdornment={
              field.unit && (
                <span className="pr-3.5 text-sm text-muted-foreground">
                  {field.unit}
                </span>
              )
            }
          />
          {field.hint && (
            <p className="text-xs text-muted-foreground">{field.hint}</p>
          )}
        </div>
      );
    case 'select':
      return (
        <SelectField
          control={form.control}
          name={field.name}
          label={field.label}
          placeholder={field.placeholder}
          clearLabel={field.clearLabel}
        >
          {field.options.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectField>
      );
    case 'phone':
      return (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{field.label}</span>
          <div className="flex h-11 items-center rounded-md border border-input bg-card px-3 py-1">
            <PhoneInput control={form.control} name={field.name} />
          </div>
        </div>
      );
    default: {
      const { normalize } = field;

      return (
        <InputField
          control={form.control}
          name={field.name}
          label={field.label}
          type={field.kind}
          onBlur={
            normalize &&
            ((e) =>
              form.setValue(
                field.name,
                normalize(e.target.value) as PathValue<
                  TValues,
                  typeof field.name
                >,
                { shouldValidate: true },
              ))
          }
        />
      );
    }
  }
};

/** A switch reads and edits in place; disabled while not editing. */
export const ProfileSwitchField = <TValues extends FieldValues>({
  field,
  form,
  isEditing,
}: {
  field: Extract<TProfileField<TValues>, { kind: 'switch' }>;
  form: UseFormReturn<TValues>;
  isEditing: boolean;
}) => (
  <div className="px-4 py-3 md:px-6">
    <SwitchFormField
      control={form.control}
      name={field.name}
      label={field.label}
      description={field.description}
      disabled={field.disabled || !isEditing}
    />
  </div>
);
