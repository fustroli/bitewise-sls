import FieldFrame, {
  FieldControl,
  IFieldProps,
} from '@/app/components/form/FieldFrame';

import { FieldValues } from 'react-hook-form';
import { Switch } from '@/app/components/ui/switch';

interface IProps<T extends FieldValues> extends IFieldProps<T> {
  label: string;
  description: string;
  disabled?: boolean;
}
const SwitchFormField = <T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
}: IProps<T>) => (
  <FieldFrame
    control={control}
    name={name}
    label={label}
    description={description}
    className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"
  >
    {(field) => (
      <FieldControl>
        <Switch
          checked={field.value}
          onCheckedChange={field.onChange}
          disabled={disabled}
        />
      </FieldControl>
    )}
  </FieldFrame>
);

export default SwitchFormField;
