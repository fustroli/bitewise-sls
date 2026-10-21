import {
  BMI_SCALE,
  BODY_FAT_SCALE,
  GOAL_SCALE_MAX_PERCENT,
} from '@/app/(modules)/dashboard/components/Overview/overview.constants';

import { BODY_FAT_BANDS } from '@/app/(modules)/dashboard/(modules)/_body-metrics/constants';
import { EBodyFatCategory } from '@/app/(modules)/dashboard/(modules)/_body-metrics/enums';
import { ESex } from '@/app/(modules)/dashboard/(modules)/_user/enums';
import { IBodyStats } from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { scalePosition } from '@/app/utils/helpers';

/** Which of the three setup steps the User has done. */
export const setupProgress = (
  bodyStats: Partial<IBodyStats> | undefined,
  dateOfBirth: string | undefined,
) => {
  const stats = bodyStats ?? {};
  const isSet = (value: unknown) => value !== null && value !== undefined;

  return {
    bodyStats: [stats.sex, stats.heightCm, stats.weightKg].every(isSet),
    activity: isSet(stats.activityLevel) && isSet(dateOfBirth),
    measurements:
      isSet(stats.neckCm) &&
      isSet(stats.waistCm) &&
      (stats.sex !== ESex.FEMALE || isSet(stats.hipCm)),
  };
};

/** The four BMI zones of the scale, by the WHO table's broad bands. */
export const BMI_ZONES = [
  { zone: 'under', from: BMI_SCALE.min, to: 18.5, className: 'bg-zone-low' },
  { zone: 'normal', from: 18.5, to: 25, className: 'bg-zone-normal' },
  { zone: 'over', from: 25, to: 30, className: 'bg-zone-over' },
  { zone: 'obese', from: 30, to: BMI_SCALE.max, className: 'bg-zone-obese' },
] as const;

const BODY_FAT_ZONE_CLASSES: Record<EBodyFatCategory, string> = {
  [EBodyFatCategory.ESSENTIAL]: 'bg-zone-low',
  [EBodyFatCategory.ATHLETES]: 'bg-zone-athletes',
  [EBodyFatCategory.FITNESS]: 'bg-zone-normal',
  [EBodyFatCategory.AVERAGE]: 'bg-zone-over',
  [EBodyFatCategory.OBESE]: 'bg-zone-obese',
};

/** The sex's ACE bands as scale zones, open ends cut to the scale. */
export const bodyFatZones = (sex: ESex) =>
  BODY_FAT_BANDS[sex].map((band) => ({
    category: band.category,
    from: band.min ?? BODY_FAT_SCALE.min,
    to: band.max ?? BODY_FAT_SCALE.max,
    className: BODY_FAT_ZONE_CLASSES[band.category],
  }));

/** The band boundaries, to label under the body fat scale. */
export const bodyFatTicks = (sex: ESex) =>
  BODY_FAT_BANDS[sex].flatMap((band) => (band.max ? [band.max] : []));

/** How full a Calorie target's bar is, in %. */
export const goalBarPercent = (percentOfMaintenance: number) =>
  scalePosition(percentOfMaintenance, 0, GOAL_SCALE_MAX_PERCENT);

/** Where Maintenance (100%) sits on a Calorie target's bar, in %. */
export const GOAL_TICK_PERCENT = goalBarPercent(100);

export type TBmiZone = (typeof BMI_ZONES)[number]['zone'];
