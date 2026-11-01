import {
  MealDialog,
  MealRowActions,
} from '@/app/(modules)/dashboard/(modules)/meals/resource/form';

import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import { IIngredientOption } from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import { IMeal } from '@/app/(modules)/dashboard/(modules)/meals/interfaces';
import { IResourceList } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { MEAL_COLUMNS } from '@/app/(modules)/dashboard/(modules)/meals/constants';
import MacroLegendToolbar from '@/app/(modules)/dashboard/(modules)/meals/components/MacroLegendToolbar';
import MealCard from '@/app/(modules)/dashboard/(modules)/meals/components/Card/MealCard';
import { ingredientOptionsQuery } from '@/app/(modules)/dashboard/(modules)/ingredients/queries';
import { mealListQuery } from '@/app/(modules)/dashboard/(modules)/meals/queries';

export const mealList: IResourceList<IMeal, IIngredientOption[]> = {
  resourceKey: 'meals',
  listQuery: mealListQuery,
  layout: 'cards',
  gridClassName:
    'grid items-start gap-4 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]',
  columns: MEAL_COLUMNS,
  compareType: EComparisonKind.MEALS,
  searchable: true,
  toolbar: MacroLegendToolbar,
  formDataQuery: ingredientOptionsQuery,
  renderRow: (row, context) => <MealCard meal={row} {...context} />,
  dialog: MealDialog,
  rowActions: MealRowActions,
};
