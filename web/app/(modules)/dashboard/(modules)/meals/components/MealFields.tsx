'use client';

import { useFieldArray, useWatch } from 'react-hook-form';

import { Button } from '@/app/components/ui/button';
import { IIngredientOption } from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import { IResourceFieldsProps } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import InputField from '@/app/components/form/InputField';
import MealIngredient from '@/app/(modules)/dashboard/(modules)/meals/components/MealIngredient';
import { TMealSchema } from '@/app/(modules)/dashboard/(modules)/meals/validations';
import { convertToOptions } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useMemo } from 'react';

const MealFields = ({
  form,
  formData: ingredients,
}: IResourceFieldsProps<TMealSchema, IIngredientOption[]>) => {
  const { fields: labels } = useDictionary().resources.meals;

  const options = useMemo(() => convertToOptions(ingredients), [ingredients]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'mealIngredients',
  });

  const mealIngredients = useWatch({
    control: form.control,
    name: 'mealIngredients',
  });

  // A Meal uses distinct Ingredients: each row offers only those no other row picked.
  const optionsFor = (index: number) =>
    options.filter(
      ({ value }) =>
        !mealIngredients.some(
          (mealIngredient, other) =>
            other !== index && mealIngredient.ingredientId === value,
        ),
    );

  const { errors } = form.formState;
  const listError =
    errors.mealIngredients?.root?.message ?? errors.mealIngredients?.message;

  const addIngredient = () => {
    append({ ingredientId: '', quantity: 0 });
  };

  return (
    <>
      <InputField
        control={form.control}
        label={labels.name}
        name="name"
        type="text"
      />

      {fields.map((ingredient, index) => (
        <MealIngredient
          key={ingredient.id}
          index={index}
          control={form.control}
          options={optionsFor(index)}
          ingredients={ingredients}
          onRemove={() => remove(index)}
        />
      ))}
      {listError && (
        <p className="text-[0.8rem] font-medium text-destructive">
          {listError}
        </p>
      )}
      <Button type="button" onClick={addIngredient} variant="default">
        {labels.addIngredient}
      </Button>
    </>
  );
};

export default MealFields;
