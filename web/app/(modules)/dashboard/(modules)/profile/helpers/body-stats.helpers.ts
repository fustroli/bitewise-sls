import {
  IUser,
  IUserChange,
} from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { TBodyStatsSchema } from '@/app/(modules)/dashboard/(modules)/profile/validations';

export const toBodyStatsFormValues = (user: IUser): TBodyStatsSchema => ({
  sex: user.bodyStats?.sex ?? null,
  heightCm: user.bodyStats?.heightCm ?? null,
  weightKg: user.bodyStats?.weightKg ?? null,
  neckCm: user.bodyStats?.neckCm ?? null,
  waistCm: user.bodyStats?.waistCm ?? null,
  hipCm: user.bodyStats?.hipCm ?? null,
  activityLevel: user.bodyStats?.activityLevel ?? null,
});

/** Only the Body stats that differ from the User's; an emptied one is `null`. */
export const toBodyStatsChange = (
  values: TBodyStatsSchema,
  user: IUser,
): IUserChange => {
  const saved = toBodyStatsFormValues(user);
  const changed = (Object.keys(values) as (keyof TBodyStatsSchema)[]).filter(
    (key) => values[key] !== saved[key],
  );

  return {
    bodyStats: Object.fromEntries(changed.map((key) => [key, values[key]])),
  };
};
