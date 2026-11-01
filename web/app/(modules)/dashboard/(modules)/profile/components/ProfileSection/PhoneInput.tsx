'use client';

// The phone input and its styles, in their own file so ProfileField can load
// them lazily: libphonenumber's metadata is only needed in edit mode.
import 'react-phone-number-input/style.css';

import { FieldValues } from 'react-hook-form';
import { IFieldProps } from '@/app/components/form/FieldFrame';
import PhoneInputWithCountry from 'react-phone-number-input/react-hook-form';

const PhoneInput = <T extends FieldValues>({
  control,
  name,
}: IFieldProps<T>) => (
  <PhoneInputWithCountry
    name={name}
    control={control}
    className="focus:outline-none"
  />
);

export default PhoneInput;
