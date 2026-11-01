import { TDictionary } from '@/app/providers/dictionary-provider';
import { z } from 'zod';

export const createMealSchema = ({ resources: { meals } }: TDictionary) => {
  const mealIngredientSchema = z.object({
    ingredientId: z.string().min(1, meals.validation.ingredientRequired),
    quantity: z
      .number({ error: meals.validation.quantityPositive })
      .positive({ message: meals.validation.quantityPositive }),
  });

  return z.object({
    name: z.string().min(1, meals.validation.nameRequired),
    mealIngredients: z
      .array(mealIngredientSchema)
      .min(1, meals.validation.ingredientsRequired)
      // A Meal uses distinct Ingredients; flag every repeat after the first
      // (an unpicked row already reports `ingredientRequired`).
      .superRefine((mealIngredients, ctx) => {
        const seen = new Set<string>();
        mealIngredients.forEach(({ ingredientId }, index) => {
          if (ingredientId && seen.has(ingredientId)) {
            ctx.addIssue({
              code: 'custom',
              path: [index, 'ingredientId'],
              message: meals.validation.ingredientDuplicate,
            });
          }
          seen.add(ingredientId);
        });
      }),
  });
};

export type TMealSchema = z.infer<ReturnType<typeof createMealSchema>>;
