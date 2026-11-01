/** What a picker needs to offer a Meal plan, and to load its Meals. */
export interface IMealPlanOption {
  id: string;
  name: string;
  /** The Meal plan's Meals, in its order. */
  mealIds: string[];
}
