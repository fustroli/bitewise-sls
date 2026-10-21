'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import { FieldValues } from 'react-hook-form';
import { IFieldProps } from '@/app/components/form/FieldFrame';
import InputField from '@/app/components/form/InputField';
import { useState } from 'react';

interface IProps<T extends FieldValues> extends IFieldProps<T> {
  label: string;
}
const PasswordInput = <T extends FieldValues>({
  control,
  label,
  name,
}: IProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputField
      control={control}
      label={label}
      name={name}
      type={showPassword ? 'text' : 'password'}
      endAdornment={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? (
            <EyeIcon className="size-4" aria-hidden="true" />
          ) : (
            <EyeOffIcon className="size-4" aria-hidden="true" />
          )}
          <span className="sr-only">
            {showPassword ? 'Hide password' : 'Show password'}
          </span>
        </Button>
      }
    />
  );
};

export default PasswordInput;
