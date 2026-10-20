import { NUTRIENTS, type Nutrient } from '@bitewise/shared';
import type { IngredientItem, MealItem } from './items';
import { mapById } from './owned';

// A Meal as the API returns it, for the meals and meal plans Lambdas.

export const ingredientIds = (meal: Pick<MealItem, 'ingredients'>) => meal.ingredients.map((member) => member.ingredientId);

/** Today's shape: Meal ingredients in position order, each with its Ingredient's name, nutrients and unit. */
export function serializeMeal(meal: MealItem, ingredients: Map<string, IngredientItem>) {
  return {
    id: meal.id,
    name: meal.name,
    mealIngredients: meal.ingredients.map(({ ingredientId, quantity }) => {
      const ingredient = ingredients.get(ingredientId);
      return {
        ingredientId,
        ingredientName: ingredient?.name,
        quantity,
        ...(Object.fromEntries(NUTRIENTS.map((n) => [n, ingredient?.[n]])) as Record<Nutrient, number>),
        unit: ingredient?.unit,
      };
    }),
  };
}

/** The Ingredients of these Meals, fetched once for all of them. */
export function ingredientsOf(owner: string, meals: MealItem[]) {
  return mapById<IngredientItem>(owner, 'ING', meals.flatMap(ingredientIds));
}
