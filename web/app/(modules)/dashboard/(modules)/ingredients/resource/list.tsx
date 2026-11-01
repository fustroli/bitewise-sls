import {
  IngredientDialog,
  IngredientRowActions,
} from '@/app/(modules)/dashboard/(modules)/ingredients/resource/form';

import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import { IIngredient } from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import { INGREDIENT_COLUMNS } from '@/app/(modules)/dashboard/(modules)/ingredients/constants';
import { IResourceList } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import IngredientListItem from '@/app/(modules)/dashboard/(modules)/ingredients/components/Table/IngredientListItem';
import IngredientTableRow from '@/app/(modules)/dashboard/(modules)/ingredients/components/Table/IngredientTableRow';
import { ingredientListQuery } from '@/app/(modules)/dashboard/(modules)/ingredients/queries';

export const ingredientList: IResourceList<IIngredient> = {
  resourceKey: 'ingredients',
  listQuery: ingredientListQuery,
  layout: 'table',
  columns: INGREDIENT_COLUMNS,
  compareType: EComparisonKind.INGREDIENTS,
  searchable: true,
  renderRow: (row, context) => <IngredientTableRow row={row} {...context} />,
  renderMobileRow: (row, { lang, edit, compareHref }) => (
    <IngredientListItem
      row={row}
      lang={lang}
      edit={edit}
      compareHref={compareHref}
    />
  ),
  dialog: IngredientDialog,
  rowActions: IngredientRowActions,
};
