import { TDictionary, copy } from '@/app/copy';

export type { TDictionary };

/** The app's copy; a plain lookup kept under the old hook's name. */
export function useDictionary(): TDictionary {
  return copy;
}
