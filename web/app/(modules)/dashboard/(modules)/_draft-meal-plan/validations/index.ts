import {
  DRAFT_STORAGE_VERSION,
  MEAL_MULTIPLIER_STEP,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/constants';
import { EDraftLineKind } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/enums';
import { TDictionary } from '@/app/providers/dictionary-provider';
import { ULID } from '@bitewise/shared';
import { z } from 'zod';

// `itemId` (a Meal or Ingredient id) is '' until picked; `quantity` is null while its field is emptied.
export const storedLineSchema = z.object({
  kind: z.enum(EDraftLineKind),
  itemId: z.union([z.literal(''), z.string().regex(ULID)]),
  quantity: z.number().nullable(),
});

/** What localStorage holds: lines as edited, valid or not. */
export const storedDraftSchema = z.object({
  version: z.literal(DRAFT_STORAGE_VERSION),
  collapsed: z.boolean(),
  lines: z.array(storedLineSchema),
});

export type TStoredDraft = z.infer<typeof storedDraftSchema>;
export type TDraftLine = TStoredDraft['lines'][number];

/** Flags incomplete lines in the editor; the draft is saved regardless. */
export const createDraftSchema = ({
  draftMealPlan: { validation },
}: TDictionary) =>
  z.object({
    lines: z.array(
      storedLineSchema
        .extend({
          itemId: z.string().min(1, { message: validation.itemRequired }),
        })
        .superRefine(({ kind, quantity }, ctx) => {
          if (quantity === null || quantity <= 0) {
            ctx.addIssue({
              code: 'custom',
              path: ['quantity'],
              message: validation.quantityPositive,
            });
          } else if (
            kind === EDraftLineKind.MEAL &&
            !Number.isInteger(quantity / MEAL_MULTIPLIER_STEP)
          ) {
            ctx.addIssue({
              code: 'custom',
              path: ['quantity'],
              message: validation.multiplierStep,
            });
          }
        }),
    ),
  });

export type TDraftSchema = z.infer<ReturnType<typeof createDraftSchema>>;

export const createLoadMealPlanSchema = ({
  draftMealPlan: { validation },
}: TDictionary) =>
  z.object({
    mealPlanId: z.string().min(1, { message: validation.mealPlanRequired }),
  });

export type TLoadMealPlanSchema = z.infer<
  ReturnType<typeof createLoadMealPlanSchema>
>;
