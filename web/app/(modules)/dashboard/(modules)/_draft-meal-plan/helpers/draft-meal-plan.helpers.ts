import {
  DEFAULT_MEAL_MULTIPLIER,
  DRAFT_STORAGE_VERSION,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/constants';
import {
  IDraftSources,
  IResolvedDraft,
  TDraftLineState,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/interfaces';
import {
  TDraftLine,
  TStoredDraft,
  storedDraftSchema,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import {
  mealIngredientNutrition,
  mealNutrition,
  scaleNutrition,
  sumNutrition,
} from '@/app/(modules)/dashboard/(modules)/_nutrition/helpers';

import { EDraftLineKind } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/enums';
import { EMPTY_NUTRITION } from '@/app/(modules)/dashboard/(modules)/_nutrition/constants';
import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';
import { IIngredientOption } from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import { INutrition } from '@/app/(modules)/dashboard/(modules)/_nutrition/interfaces';
import { ULID } from '@bitewise/shared';
import { formatCalories } from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';

/** Per User, since localStorage is shared by everyone using the browser. */
export const draftStorageKey = (userId: string) =>
  `bitewise:draft-meal-plan:v${DRAFT_STORAGE_VERSION}:${userId}`;

export const EMPTY_DRAFT: TStoredDraft = {
  version: DRAFT_STORAGE_VERSION,
  collapsed: false,
  lines: [],
};

/** `null` when there is no draft, or it is unreadable or another version. */
export const parseDraft = (raw: string | null): TStoredDraft | null => {
  if (raw === null) return null;
  try {
    const result = storedDraftSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

export const serializeDraft = (draft: TStoredDraft) => JSON.stringify(draft);

/** A Meal plan id from a query param: a ULID, else `undefined`. */
export const toMealPlanId = (value: string | null) =>
  value && ULID.test(value) ? value : undefined;

/** A copy of a Meal plan as a draft: one serving of each of its Meals. */
export const mealPlanDraft = (mealIds: string[]): TStoredDraft => ({
  ...EMPTY_DRAFT,
  lines: mealIds.map((itemId) => ({
    kind: EDraftLineKind.MEAL,
    itemId,
    quantity: DEFAULT_MEAL_MULTIPLIER,
  })),
});

const findMeal = (id: string, { meals }: IDraftSources) =>
  meals.find((meal) => meal.id === id);

const findIngredient = (id: string, { ingredients }: IDraftSources) =>
  ingredients.find((ingredient) => ingredient.id === id);

/** The ids of the lines' picked items of `kind`. */
export const draftItemIds = (lines: TDraftLine[], kind: EDraftLineKind) =>
  lines
    .filter((line) => line.kind === kind && line.itemId !== '')
    .map(({ itemId }) => itemId);

export const draftLineState = (
  { kind, itemId }: TDraftLine,
  sources: IDraftSources,
): TDraftLineState => {
  const isMeal = kind === EDraftLineKind.MEAL;
  if (itemId === '') return 'ready';
  if (isMeal ? findMeal(itemId, sources) : findIngredient(itemId, sources))
    return 'ready';
  const missing = isMeal ? sources.missing.meals : sources.missing.ingredients;
  return missing.includes(itemId) ? 'missing' : 'pending';
};

/** No line's item is still loading. */
export const isDraftSettled = (lines: TDraftLine[], sources: IDraftSources) =>
  lines.every((line) => draftLineState(line, sources) !== 'pending');

/** Drops lines whose Meal or Ingredient is gone; loading and unpicked ones stay. */
export const resolveDraftLines = (
  lines: TDraftLine[],
  sources: IDraftSources,
) => {
  const kept = lines.filter(
    (line) => draftLineState(line, sources) !== 'missing',
  );
  return { lines: kept, removed: lines.length - kept.length };
};

/** The draft with `resolveDraftLines` applied. */
export const resolveDraft = (
  draft: TStoredDraft,
  sources: IDraftSources,
): IResolvedDraft => {
  const { lines, removed } = resolveDraftLines(draft.lines, sources);
  return { draft: { ...draft, lines }, removed };
};

/** The Unit an Ingredient line's amount is in; unset for a Meal or unpicked line. */
export const draftLineUnit = (
  { kind, itemId }: TDraftLine,
  ingredients: IIngredientOption[],
): EUnit | undefined =>
  kind === EDraftLineKind.INGREDIENT
    ? ingredients.find((ingredient) => ingredient.id === itemId)?.unit
    : undefined;

/**
 * A line's Nutrition at full precision: a Meal's scaled by its multiplier, an
 * Ingredient's by its amount (grams per 100 g, or pieces). An unpicked line or
 * an emptied quantity counts as 0.
 */
export const draftLineNutrition = (
  { kind, itemId, quantity }: TDraftLine,
  sources: IDraftSources,
): INutrition => {
  const amount = quantity ?? 0;

  if (kind === EDraftLineKind.MEAL) {
    const meal = findMeal(itemId, sources);
    return meal ? scaleNutrition(mealNutrition(meal), amount) : EMPTY_NUTRITION;
  }

  const ingredient = findIngredient(itemId, sources);
  return ingredient
    ? mealIngredientNutrition({ ...ingredient, quantity: amount })
    : EMPTY_NUTRITION;
};

export const draftNutrition = (
  lines: TDraftLine[],
  sources: IDraftSources,
): INutrition =>
  sumNutrition(lines.map((line) => draftLineNutrition(line, sources)));

/** Signed and rounded like a Calorie target, e.g. `+620` or `-150`. */
export const formatCalorieDelta = (delta: number, locale: string) => {
  const rounded = Math.round(delta);
  return `${rounded > 0 ? '+' : ''}${formatCalories(rounded, locale)}`;
};
