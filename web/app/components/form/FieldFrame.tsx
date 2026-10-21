import {
  ComponentPropsWithoutRef,
  ReactElement,
  ReactNode,
  forwardRef,
} from 'react';
import {
  Control,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from '@/app/components/ui/form';

import { cn } from '@/app/lib/utils';

/** What every field takes: `T` is inferred from `control`, so `name` is checked. */
export interface IFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
}

interface IProps<T extends FieldValues> extends IFieldProps<T> {
  label?: string;
  /** Keeps the label for screen readers only, e.g. in a table row. */
  hideLabel?: boolean;
  description?: string;
  /** Shown over the control's right edge. */
  adornment?: ReactNode;
  className?: string;
  children: (field: ControllerRenderProps<T, FieldPath<T>>) => ReactElement;
}

/** The frame every field shares: label, control, error message, adornment. */
const FieldFrame = <T extends FieldValues>({
  control,
  name,
  label,
  hideLabel,
  description,
  adornment,
  className,
  children,
}: IProps<T>) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className={className}>
        {(label || description) && (
          <div className={cn('space-y-0.5', hideLabel && 'sr-only')}>
            {label && (
              <FormLabel
                htmlFor={name}
                className="block first-letter:uppercase"
              >
                {label}
              </FormLabel>
            )}
            {description && <FormDescription>{description}</FormDescription>}
          </div>
        )}
        <div className="relative">
          {children(field)}
          {adornment && (
            <div className="absolute inset-y-0 right-0 flex items-center">
              {adornment}
            </div>
          )}
        </div>
        <FormMessage />
      </FormItem>
    )}
  />
);

/**
 * Wraps the focusable control; its `id` is the field's name. Passes props and
 * `ref` on, so it can sit under an `asChild` trigger (e.g. `PopoverTrigger`).
 */
export const FieldControl = forwardRef<
  HTMLElement,
  ComponentPropsWithoutRef<typeof FormControl> & { children: ReactElement }
>((props, ref) => {
  const { name } = useFormField();

  return <FormControl ref={ref} {...props} id={name} />;
});
FieldControl.displayName = 'FieldControl';

export default FieldFrame;
