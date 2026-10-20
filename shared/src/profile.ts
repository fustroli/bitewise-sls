import { z } from 'zod';
import { MAX_LENGTH } from './constants';
import { oneOf } from './rules';

// The Profile groups of PATCH /users/me, as in bitewise-backend's user DTOs. In a patch a missing
// group or field is unchanged and a null field is cleared; a group itself can't be null.

export const SEXES = ['MALE', 'FEMALE'] as const;
export const ACTIVITY_LEVELS = ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'] as const;
// Daily kcal goal relative to Maintenance; lose/gain at 0.25 / 0.5 / 1 kg per week
export const CALORIE_TARGETS = ['maintenance', 'lose_mild', 'lose_normal', 'lose_fast', 'gain_mild', 'gain_normal', 'gain_fast'] as const;
export const MACRO_PLANS = ['balanced', 'low_fat', 'low_carb', 'high_protein'] as const;

export const BODY_STATS_LIMITS = {
  heightCm: { min: 100, max: 250 },
  weightKg: { min: 30, max: 300 },
  neckCm: { min: 20, max: 60 },
  waistCm: { min: 40, max: 200 },
  hipCm: { min: 50, max: 200 },
} as const;
// Tape measurements are taken to the nearest half centimetre
export const MEASUREMENT_CM_STEP = 0.5;

function text(field: string) {
  return z
    .string({ error: `${field} must be a string` })
    .max(MAX_LENGTH, { error: `${field} must be shorter than or equal to ${MAX_LENGTH} characters` })
    .nullable()
    .optional();
}

type Measure = { integer?: true; step?: number; oneDecimal?: true };

/** A body measurement in its range; `step` like class-validator's custom IsMultipleOf. */
function measured(field: keyof typeof BODY_STATS_LIMITS, { integer, step, oneDecimal }: Measure = {}) {
  const { min, max } = BODY_STATS_LIMITS[field];
  let n = z.number({ error: `${field} must be a number conforming to the specified constraints` });
  if (integer) n = n.int({ error: `${field} must be an integer number` });
  return n
    .refine((value) => !oneDecimal || Math.abs(value * 10 - Math.round(value * 10)) < 1e-9, {
      error: `${field} must be a number conforming to the specified constraints`,
    })
    .refine((value) => !step || Number.isInteger(value / step), { error: `${field} must be a multiple of ${step}` })
    .refine((value) => value >= min, { error: `${field} must not be less than ${min}` })
    .refine((value) => value <= max, { error: `${field} must not be greater than ${max}` })
    .nullable()
    .optional();
}

/** A calendar date; stored as YYYY-MM-DD like the EC2 app's date column. */
const dateOfBirth = z
  .string({ error: 'dateOfBirth must be a string' })
  .refine((value) => !Number.isNaN(Date.parse(value)), { error: 'dateOfBirth must be a valid date' })
  .transform((value) => new Date(value).toISOString().split('T')[0]!)
  .nullable()
  .optional();

export const personalInformationSchema = z.strictObject({
  userName: text('userName'),
  firstName: text('firstName'),
  lastName: text('lastName'),
  phoneNumber: text('phoneNumber'),
  dateOfBirth,
});

export const socialProfilesSchema = z.strictObject({
  facebook: text('facebook'),
  twitter: text('twitter'),
  instagram: text('instagram'),
  linkedin: text('linkedin'),
});

export const bodyStatsSchema = z.strictObject({
  sex: oneOf('sex', SEXES).nullable().optional(),
  heightCm: measured('heightCm', { integer: true }),
  weightKg: measured('weightKg', { oneDecimal: true }),
  activityLevel: oneOf('activityLevel', ACTIVITY_LEVELS).nullable().optional(),
  neckCm: measured('neckCm', { step: MEASUREMENT_CM_STEP }),
  waistCm: measured('waistCm', { step: MEASUREMENT_CM_STEP }),
  hipCm: measured('hipCm', { step: MEASUREMENT_CM_STEP }),
});

export const targetsSchema = z.strictObject({
  calorieTarget: oneOf('calorieTarget', CALORIE_TARGETS).nullable().optional(),
  macroPlan: oneOf('macroPlan', MACRO_PLANS).nullable().optional(),
});

const group = <T extends z.ZodType>(name: string, schema: T) =>
  z.custom<unknown>((value) => typeof value === 'object' && value !== null && !Array.isArray(value), {
    error: `${name} must be an object`,
  }).pipe(schema).optional();

export const profilePatchSchema = z.strictObject({
  personalInformation: group('personalInformation', personalInformationSchema),
  socialProfiles: group('socialProfiles', socialProfilesSchema),
  bodyStats: group('bodyStats', bodyStatsSchema),
  targets: group('targets', targetsSchema),
});
export type ProfilePatch = z.infer<typeof profilePatchSchema>;

export const PROFILE_GROUPS = {
  personalInformation: ['userName', 'firstName', 'lastName', 'phoneNumber', 'dateOfBirth'],
  socialProfiles: ['facebook', 'twitter', 'instagram', 'linkedin'],
  bodyStats: ['sex', 'heightCm', 'weightKg', 'activityLevel', 'neckCm', 'waistCm', 'hipCm'],
  targets: ['calorieTarget', 'macroPlan'],
} as const;
export type ProfileGroup = keyof typeof PROFILE_GROUPS;
