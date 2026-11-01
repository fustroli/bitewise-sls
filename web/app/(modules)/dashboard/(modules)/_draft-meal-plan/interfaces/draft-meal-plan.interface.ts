import {
  IIngredient,
  IIngredientOption,
} from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import {
  IMeal,
  IMealOption,
} from '@/app/(modules)/dashboard/(modules)/meals/interfaces';
import {
  TDraftLine,
  TStoredDraft,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';

/**
 * What is known of the Meals and Ingredients draft lines refer to by id: the
 * records fetched so far, and the ids found gone. An id in neither is still
 * loading.
 */
export interface IDraftSources {
  meals: IMeal[];
  ingredients: IIngredient[];
  missing: { meals: string[]; ingredients: string[] };
}

/** Every Meal and Ingredient of the User, for the line pickers. */
export interface IDraftOptions {
  meals: IMealOption[];
  ingredients: IIngredientOption[];
}

/** Where a line's item stands; an unpicked line is `ready`. */
export type TDraftLineState = 'ready' | 'pending' | 'missing';

export interface IDraftRecords {
  sources: IDraftSources;
  /** Fetches what the lines' items need that isn't fetched yet. */
  request: (lines: TDraftLine[]) => void;
  /** Some fetch failed: its lines stay loading until `retry()`. */
  hasFailed: boolean;
  retry: () => void;
}

export interface IResolvedDraft {
  draft: TStoredDraft;
  /** How many lines were dropped because their Meal or Ingredient is gone. */
  removed: number;
}

export interface IDraftMealPlanContext {
  /** The stored draft: `undefined` until read on the client, `null` for none. */
  stored: TStoredDraft | null | undefined;
  /** Bumped by every load, so a mounted editor starts over from the store. */
  loads: number;
  start: () => void;
  save: (draft: TStoredDraft) => void;
  load: (draft: TStoredDraft) => void;
  clear: () => void;
  /** Opens the Load meal plan dialog, optionally with a plan picked. */
  openLoad: (mealPlanId?: string) => void;
  mealPlansHref: string;
}
