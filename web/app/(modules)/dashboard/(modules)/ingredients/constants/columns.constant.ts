import { IResourceColumn } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';

export const INGREDIENT_COLUMNS: IResourceColumn[] = [
  { id: 'name', sortable: true, align: 'justify-start' },
  { id: 'calories', sortable: true, align: 'justify-end' },
  { id: 'protein', sortable: true, align: 'justify-end', swatch: 'protein' },
  {
    id: 'totalCarbohydrates',
    sortable: true,
    align: 'justify-end',
    swatch: 'carbs',
  },
  { id: 'totalFat', sortable: true, align: 'justify-end', swatch: 'fat' },
  { id: 'dietaryFiber', sortable: true, align: 'justify-end' },
];
