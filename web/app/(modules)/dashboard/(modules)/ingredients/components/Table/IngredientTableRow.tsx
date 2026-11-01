import { TableCell, TableRow } from '@/app/components/ui/table';
import { formatAmount, interpolate } from '@/app/utils/helpers';

import { IIngredient } from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import { IResourceRowContext } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import MacroValue from '@/app/components/nutrition/MacroValue';

interface IProps extends IResourceRowContext {
  row: IIngredient;
}

const cellClass = 'px-4 py-3.5 text-right align-middle text-[15px]';

/** One Ingredient's table row, from `md` up. */
const IngredientTableRow = ({ row, actions, lang, dictionary }: IProps) => {
  const labels = dictionary.resources.ingredients;
  const amount = (value: number) => formatAmount(value, lang);

  return (
    <TableRow className="hover:bg-surface-subtle/60">
      <TableCell className="px-5 py-3.5 align-middle">
        <div className="flex flex-col gap-1">
          <span className="text-[15px] font-extrabold">{row.name}</span>
          <span className="text-xs font-bold text-muted-foreground">
            {labels.units[row.unit]}
          </span>
        </div>
      </TableCell>
      <TableCell className={cellClass}>
        <MacroValue value={amount(row.calories)} unit="kcal" align="end" />
      </TableCell>
      <TableCell className={cellClass}>
        <MacroValue value={amount(row.protein)} align="end" />
      </TableCell>
      <TableCell className={cellClass}>
        <MacroValue
          value={amount(row.totalCarbohydrates)}
          sub={interpolate(labels.list.sugar, { value: amount(row.sugar) })}
          align="end"
        />
      </TableCell>
      <TableCell className={cellClass}>
        <MacroValue
          value={amount(row.totalFat)}
          sub={interpolate(labels.list.saturated, {
            value: amount(row.saturatedFat),
          })}
          align="end"
        />
      </TableCell>
      <TableCell className={cellClass}>
        <MacroValue value={amount(row.dietaryFiber)} align="end" />
      </TableCell>
      <TableCell className="py-2 pl-2 pr-4 text-right align-middle">
        {actions}
      </TableCell>
    </TableRow>
  );
};

export default IngredientTableRow;
