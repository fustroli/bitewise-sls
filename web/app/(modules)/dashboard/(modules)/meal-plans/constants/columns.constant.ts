import { IResourceColumn } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';

/** Meal plans show as cards; only the name can be sorted by (via the URL). */
export const MEAL_PLAN_COLUMNS: IResourceColumn[] = [
  { id: 'name', sortable: true },
];
