import { TDictionary } from '@/app/providers/dictionary-provider';
import { z } from 'zod';

export const createMealPlanSchema = ({
  resources: { mealPlans },
}: TDictionary) =>
  z.object({
    name: z.string().min(1, mealPlans.validation.nameRequired),
    mealIds: z.array(z.string()).min(1, mealPlans.validation.mealsRequired),
  });

export type TMealPlanSchema = z.infer<ReturnType<typeof createMealPlanSchema>>;
