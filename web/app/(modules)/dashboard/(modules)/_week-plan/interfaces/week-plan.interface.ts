import { INutrition } from '@/app/(modules)/dashboard/(modules)/_nutrition/interfaces';
import { TDraftLine } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import { TStoredWeek } from '@/app/(modules)/dashboard/(modules)/_week-plan/validations';

export interface IResolvedWeek {
  week: TStoredWeek;
  /** How many lines, across all days, were dropped because their item is gone. */
  removed: number;
}

export interface IWeekSummary {
  /** Each day's Nutrition, Monday first, full precision. */
  totals: INutrition[];
  /** Whether each day has at least one line. */
  planned: boolean[];
  plannedCount: number;
  /** The daily average over planned days only; unset without any. */
  average?: INutrition;
  /** Whether each day is on target (an empty day isn't); unset without a target. */
  onTarget?: boolean[];
  onTargetCount?: number;
}

export interface IWeekPlanContext {
  /** `undefined` until read on the client; an unset or unreadable store is the empty week. */
  week: TStoredWeek | undefined;
  /** Bumped by every change made outside the day editor, so it starts over from the store. */
  revision: number;
  /** Monday to Sunday in the User's language, e.g. `Monday`. */
  names: string[];
  /** The same, short, e.g. `Mon`. */
  shortNames: string[];
  /** Monday is 0. */
  today: number;
  selectedDay: number;
  selectDay: (day: number) => void;
  /** The day editor's changes; also writes nothing new when unchanged. */
  saveDay: (day: number, lines: TDraftLine[]) => void;
  /** Stores a week the editor already shows, e.g. with missing items dropped. */
  replaceWeek: (week: TStoredWeek) => void;
  clearDay: (day: number) => void;
  clearWeek: () => void;
  /** Opens the Load meal plan dialog, optionally with a plan picked. */
  openLoad: (mealPlanId?: string) => void;
  /** Opens the dialog copying the selected day to others. */
  openCopy: () => void;
}
