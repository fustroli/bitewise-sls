import {
  formatAmount,
  interpolate,
  macroEnergyShares,
  pluralize,
} from '@/app/utils/helpers';
import {
  mealIngredientNutrition,
  mealNutrition,
} from '@/app/(modules)/dashboard/(modules)/_nutrition/helpers';

import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';
import ExpandableCard from '@/app/components/ExpandableCard';
import { IMeal } from '@/app/(modules)/dashboard/(modules)/meals/interfaces';
import { IResourceRowContext } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import MacroAmounts from '@/app/components/nutrition/MacroAmounts';
import MacroBar from '@/app/components/nutrition/MacroBar';
import MacroValue from '@/app/components/nutrition/MacroValue';

interface IProps extends IResourceRowContext {
  meal: IMeal;
}

/** A Meal's totals, its macro split, and its ingredients behind a toggle. */
const MealCard = ({ meal, actions, dictionary, lang }: IProps) => {
  const labels = dictionary.resources.meals.card;
  const macroNames = dictionary.dashboard.bodyMetrics.macros.macros;
  const total = mealNutrition(meal);
  const amount = (value: number) => formatAmount(value, lang);
  const kcal = (value: number) => formatAmount(value, lang, 0);
  const count = meal.mealIngredients.length;

  const header = (
    <div className="flex flex-col gap-4 px-5 pb-[18px] pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-[17px] font-extrabold">{meal.name}</h2>
          <p className="text-[13px] text-muted-foreground">
            {pluralize(count, labels.ingredients, lang)} ·{' '}
            {interpolate(labels.fiber, { value: amount(total.dietaryFiber) })}
          </p>
        </div>
        <div className="-mr-2 -mt-2 shrink-0">{actions}</div>
      </div>
      <p className="flex items-baseline gap-1.5">
        <span className="text-[30px] font-extrabold leading-none tracking-tight">
          {kcal(total.calories)}
        </span>
        <span className="text-sm font-semibold text-muted-foreground">
          kcal
        </span>
      </p>
      <MacroBar
        heightClassName="h-2"
        shares={macroEnergyShares({
          protein: total.protein,
          carbs: total.totalCarbohydrates,
          fat: total.totalFat,
        })}
      />
      <div className="grid grid-cols-3 gap-2 [&_strong]:text-base [&_strong]:font-extrabold">
        <MacroValue name={macroNames.protein} value={amount(total.protein)} />
        <MacroValue
          name={macroNames.carbs}
          value={amount(total.totalCarbohydrates)}
          sub={interpolate(labels.sugar, { value: amount(total.sugar) })}
        />
        <MacroValue
          name={macroNames.fat}
          value={amount(total.totalFat)}
          sub={interpolate(labels.saturated, {
            value: amount(total.saturatedFat),
          })}
        />
      </div>
    </div>
  );

  return (
    <ExpandableCard
      className="w-full"
      header={header}
      showLabel={pluralize(count, labels.show, lang)}
      hideLabel={labels.hide}
    >
      <ul className="flex flex-col px-5 pb-3">
        {meal.mealIngredients.map((mealIngredient) => {
          const nutrition = mealIngredientNutrition(mealIngredient);

          return (
            <li
              key={mealIngredient.ingredientId}
              className="flex justify-between gap-3 border-t py-2.5 text-sm first:border-t-0"
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-bold">
                  {mealIngredient.ingredientName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {mealIngredient.unit === EUnit.PIECE
                    ? pluralize(mealIngredient.quantity, labels.pieces, lang)
                    : interpolate(labels.grams, {
                        value: amount(mealIngredient.quantity),
                      })}
                </span>
              </span>
              <span className="flex flex-col items-end gap-0.5 text-right">
                <span className="font-extrabold">
                  {kcal(nutrition.calories)} kcal
                </span>
                <MacroAmounts
                  amounts={{
                    protein: amount(nutrition.protein),
                    carbs: amount(nutrition.totalCarbohydrates),
                    fat: amount(nutrition.totalFat),
                  }}
                  names={macroNames}
                  className="justify-end"
                />
              </span>
            </li>
          );
        })}
      </ul>
    </ExpandableCard>
  );
};

export default MealCard;
