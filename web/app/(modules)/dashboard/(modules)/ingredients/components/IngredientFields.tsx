'use client';

import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';
import { INGREDIENT_NUMBER_FIELDS } from '@/app/(modules)/dashboard/(modules)/ingredients/constants';
import { IResourceFieldsProps } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import InputField from '@/app/components/form/InputField';
import SelectField from '@/app/components/form/Select';
import { SelectItem } from '@/app/components/ui/select';
import { TIngredientSchema } from '@/app/(modules)/dashboard/(modules)/ingredients/validations';
import { useDictionary } from '@/app/providers/dictionary-provider';

const IngredientFields = ({
  form,
}: IResourceFieldsProps<TIngredientSchema, undefined>) => {
  const { fields } = useDictionary().resources.ingredients;

  return (
    <>
      <InputField
        control={form.control}
        label={fields.name}
        name="name"
        type="text"
      />
      {INGREDIENT_NUMBER_FIELDS.map((name) => (
        <InputField
          key={name}
          control={form.control}
          label={fields[name]}
          name={name}
          type="number"
        />
      ))}
      <SelectField
        name="unit"
        control={form.control}
        label={fields.unit}
        placeholder={fields.unitPlaceholder}
      >
        {Object.values(EUnit).map((unit) => (
          <SelectItem key={unit} value={unit}>
            {unit}
          </SelectItem>
        ))}
      </SelectField>
    </>
  );
};

export default IngredientFields;
