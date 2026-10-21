import FieldFrame, {
  FieldControl,
  IFieldProps,
} from '@/app/components/form/FieldFrame';

import { FieldValues } from 'react-hook-form';
import { Input } from '@/app/components/ui/input';
import React from 'react';

interface IProps<T extends FieldValues> extends IFieldProps<T> {
  accept: string;
  label: string;
  changeHandler: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const FileUploadFormField = <T extends FieldValues>({
  control,
  name,
  accept,
  label,
  changeHandler,
}: IProps<T>) => (
  <FieldFrame control={control} name={name} label={label}>
    {() => (
      <FieldControl>
        <Input type="file" accept={accept} onChange={changeHandler} />
      </FieldControl>
    )}
  </FieldFrame>
);

export default FileUploadFormField;
