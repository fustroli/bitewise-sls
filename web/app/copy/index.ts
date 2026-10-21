import en from './en.json';

/**
 * The app's copy. English only: the old app's locales and dictionary loading
 * are gone, the shape stays so `useDictionary()` callers port unchanged.
 */
export const copy = en;

/** For number and date formatting. */
export const LOCALE = 'en';

export type TDictionary = typeof copy;
