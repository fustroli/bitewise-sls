import type { MealIngredientInput, Nutrient, Unit } from '@bitewise/shared';
import type { OwnedItem } from './owned';

// Item shapes on the single table (docs/plan.md, Data model).

export type IngredientItem = OwnedItem & Record<Nutrient, number> & { unit: Unit };

/** `ingredients` is ordered: array position is the Meal ingredient's position. */
export type MealItem = OwnedItem & { ingredients: MealIngredientInput[] };
