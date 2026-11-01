import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import { IComparisonItem } from '@/app/(modules)/dashboard/(modules)/_comparison/interfaces';

export type TComparisonItems = Record<EComparisonKind, IComparisonItem[]>;

/** What a slot picker offers. */
export interface IComparisonOption {
  id: string;
  name: string;
}

export type TComparisonOptions = Record<EComparisonKind, IComparisonOption[]>;

/** A filled slot: its item and its position (0 is the baseline). */
export interface IChosenItem {
  slot: number;
  item: IComparisonItem;
}

/** The slots' colours: baseline, item 2, item 3. */
export const SLOT_DOT_CLASSES = [
  'bg-compare-1',
  'bg-compare-2',
  'bg-compare-3',
];
