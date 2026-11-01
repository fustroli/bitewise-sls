import {
  MealPlanDialog,
  MealPlanRowActions,
} from '@/app/(modules)/dashboard/(modules)/meal-plans/resource/form';

import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import { IMealOption } from '@/app/(modules)/dashboard/(modules)/meals/interfaces';
import { IMealPlan } from '@/app/(modules)/dashboard/(modules)/meal-plans/interfaces';
import { IResourceList } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { MEAL_PLAN_COLUMNS } from '@/app/(modules)/dashboard/(modules)/meal-plans/constants';
import MealPlanCard from '@/app/(modules)/dashboard/(modules)/meal-plans/components/Card/MealPlanCard';
import MealPlanTargetsNote from '@/app/(modules)/dashboard/(modules)/meal-plans/components/MealPlanTargetsNote';
import { PROFILE_SECTION_IDS } from '@/app/(modules)/dashboard/(modules)/_user/constants';
import PlansSwitch from '@/app/(modules)/dashboard/(modules)/meal-plans/components/PlansSwitch';
import { mealOptionsQuery } from '@/app/(modules)/dashboard/(modules)/meals/queries';
import { mealPlanListQuery } from '@/app/(modules)/dashboard/(modules)/meal-plans/queries';

export const mealPlanList: IResourceList<IMealPlan, IMealOption[]> = {
  resourceKey: 'mealPlans',
  listQuery: mealPlanListQuery,
  layout: 'cards',
  gridClassName: 'flex flex-col gap-4',
  columns: MEAL_PLAN_COLUMNS,
  compareType: EComparisonKind.MEAL_PLANS,
  searchable: true,
  header: PlansSwitch,
  toolbar: MealPlanTargetsNote,
  formDataQuery: mealOptionsQuery,
  renderRow: (row, context) => (
    <MealPlanCard
      mealPlan={row}
      bodyStatsHref={`/dashboard/profile#${PROFILE_SECTION_IDS.bodyStats}`}
      {...context}
    />
  ),
  dialog: MealPlanDialog,
  rowActions: MealPlanRowActions,
};
