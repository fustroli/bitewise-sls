import {
  EMPTY_DRAFT,
  draftLineNutrition,
  draftLineState,
  draftLineUnit,
  draftNutrition,
  draftStorageKey,
  formatCalorieDelta,
  isDraftSettled,
  mealPlanDraft,
  parseDraft,
  resolveDraft,
  serializeDraft,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/helpers';
import {
  TDraftLine,
  TStoredDraft,
  createDraftSchema,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import { describe, expect, it } from 'vitest';

import { EDraftLineKind } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/enums';
import { EMPTY_NUTRITION } from '@/app/(modules)/dashboard/(modules)/_nutrition/constants';
import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';
import { IDraftSources } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/interfaces';
import { IIngredient } from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import { IMeal } from '@/app/(modules)/dashboard/(modules)/meals/interfaces';
import { copy as en } from '@/app/copy';

/** A ULID for a small test number, so cases read as numbers. */
const id = (n: number) =>
  `01JAZ3Q8V6X2M5N7P9R1S3T${String(n).padStart(3, '0')}`;

const ingredient = (
  n: number,
  unit: EUnit,
  nutrition: Partial<IIngredient>,
): IIngredient => ({
  ...EMPTY_NUTRITION,
  id: id(n),
  name: `Ingredient ${n}`,
  unit,
  createTimeStamp: new Date(0),
  updateTimeStamp: new Date(0),
  deleteTimeStamp: null,
  ...nutrition,
});

const OATS = ingredient(1, EUnit.HUNDRED_GRAMS, { calories: 380, protein: 13 });
const EGG = ingredient(2, EUnit.PIECE, { calories: 70, protein: 6 });

// 50 g oats (190 kcal) + 1 egg (70 kcal) = 260 kcal.
const PORRIDGE: IMeal = {
  id: id(10),
  name: 'Porridge',
  mealIngredients: [
    {
      ...OATS,
      ingredientId: OATS.id,
      ingredientName: OATS.name,
      quantity: 50,
    },
    {
      ...EGG,
      ingredientId: EGG.id,
      ingredientName: EGG.name,
      quantity: 1,
    },
  ],
};

// Meal 99 and Ingredient 98 were fetched and found gone; anything else not
// listed is still loading.
const SOURCES: IDraftSources = {
  meals: [PORRIDGE],
  ingredients: [OATS, EGG],
  missing: { meals: [id(99)], ingredients: [id(98)] },
};

/** Item `0` is an unpicked line. */
const line = (
  kind: EDraftLineKind,
  item: number,
  quantity: number | null,
): TDraftLine => ({ kind, itemId: item ? id(item) : '', quantity });

const draft = (lines: TDraftLine[]): TStoredDraft => ({
  ...EMPTY_DRAFT,
  lines,
});

describe('draftStorageKey', () => {
  it('is per User and versioned', () => {
    expect(draftStorageKey('user-sub')).toBe(
      'bitewise:draft-meal-plan:v2:user-sub',
    );
  });
});

describe('parseDraft', () => {
  it('reads back a serialized draft', () => {
    const stored = draft([line(EDraftLineKind.MEAL, 10, 1.5)]);

    expect(parseDraft(serializeDraft(stored))).toEqual(stored);
  });

  it('is null without a draft', () => {
    expect(parseDraft(null)).toBeNull();
  });

  it.each([
    ['not JSON', '{oops'],
    ['another version', JSON.stringify({ ...EMPTY_DRAFT, version: 1 })],
    [
      'a wrong shape',
      JSON.stringify({ ...EMPTY_DRAFT, lines: [{ kind: 'pizza', itemId: 1 }] }),
    ],
    [
      'an old numeric id',
      JSON.stringify({
        ...EMPTY_DRAFT,
        lines: [{ kind: EDraftLineKind.MEAL, itemId: 10, quantity: 1 }],
      }),
    ],
  ])('discards %s', (_, raw) => {
    expect(parseDraft(raw)).toBeNull();
  });

  it('keeps lines as edited, emptied quantities included', () => {
    const stored = draft([line(EDraftLineKind.INGREDIENT, 0, null)]);

    expect(parseDraft(serializeDraft(stored))).toEqual(stored);
  });
});

describe('draftLineState', () => {
  it.each([
    ['a fetched Meal', line(EDraftLineKind.MEAL, 10, 1), 'ready'],
    ['a fetched Ingredient', line(EDraftLineKind.INGREDIENT, 2, 1), 'ready'],
    ['an unpicked line', line(EDraftLineKind.MEAL, 0, 1), 'ready'],
    ['a Meal found gone', line(EDraftLineKind.MEAL, 99, 1), 'missing'],
    [
      'an Ingredient found gone',
      line(EDraftLineKind.INGREDIENT, 98, 1),
      'missing',
    ],
    ['an item not fetched yet', line(EDraftLineKind.MEAL, 50, 1), 'pending'],
  ])('is %s: %s', (_, draftLine, state) => {
    expect(draftLineState(draftLine, SOURCES)).toBe(state);
  });

  it('looks a line up among its own kind', () => {
    // 1 is a fetched Ingredient id, not a Meal id.
    expect(draftLineState(line(EDraftLineKind.MEAL, 1, 1), SOURCES)).toBe(
      'pending',
    );
  });
});

describe('isDraftSettled', () => {
  it('is settled once every item is fetched or found gone', () => {
    expect(
      isDraftSettled(
        [line(EDraftLineKind.MEAL, 10, 1), line(EDraftLineKind.MEAL, 99, 1)],
        SOURCES,
      ),
    ).toBe(true);
  });

  it('is not while an item loads', () => {
    expect(
      isDraftSettled(
        [line(EDraftLineKind.MEAL, 10, 1), line(EDraftLineKind.MEAL, 50, 1)],
        SOURCES,
      ),
    ).toBe(false);
  });
});

describe('draftLineUnit', () => {
  it("is a picked Ingredient's Unit, from the options", () => {
    expect(
      draftLineUnit(line(EDraftLineKind.INGREDIENT, 2, 1), [
        { id: id(2), name: 'Egg', unit: EUnit.PIECE },
      ]),
    ).toBe(EUnit.PIECE);
  });

  it('is unset for a Meal', () => {
    expect(
      draftLineUnit(line(EDraftLineKind.MEAL, 2, 1), SOURCES.ingredients),
    ).toBeUndefined();
  });
});

describe('resolveDraft', () => {
  it('drops lines whose Meal or Ingredient no longer exists', () => {
    const { draft: resolved, removed } = resolveDraft(
      draft([
        line(EDraftLineKind.MEAL, 10, 1),
        line(EDraftLineKind.MEAL, 99, 1),
        line(EDraftLineKind.INGREDIENT, 2, 3),
        line(EDraftLineKind.INGREDIENT, 98, 100),
      ]),
      SOURCES,
    );

    expect(resolved.lines).toEqual([
      line(EDraftLineKind.MEAL, 10, 1),
      line(EDraftLineKind.INGREDIENT, 2, 3),
    ]);
    expect(removed).toBe(2);
  });

  it('keeps lines whose item is still loading', () => {
    expect(
      resolveDraft(draft([line(EDraftLineKind.MEAL, 50, 1)]), SOURCES).removed,
    ).toBe(0);
  });

  it('keeps unpicked lines', () => {
    expect(
      resolveDraft(draft([line(EDraftLineKind.MEAL, 0, 1)]), SOURCES).removed,
    ).toBe(0);
  });
});

describe('mealPlanDraft', () => {
  it('copies each Meal as one serving into an expanded draft', () => {
    expect(mealPlanDraft([id(10), id(11)])).toEqual({
      ...EMPTY_DRAFT,
      collapsed: false,
      lines: [
        line(EDraftLineKind.MEAL, 10, 1),
        line(EDraftLineKind.MEAL, 11, 1),
      ],
    });
  });

  it('counts Meals the draft does not know as removed once resolved', () => {
    const { draft: resolved, removed } = resolveDraft(
      mealPlanDraft([id(10), id(99)]),
      SOURCES,
    );

    expect(resolved.lines).toEqual([line(EDraftLineKind.MEAL, 10, 1)]);
    expect(removed).toBe(1);
  });
});

describe('draftLineNutrition', () => {
  it('scales a Meal by its multiplier', () => {
    // Porridge: 50 g oats (190 kcal) + 1 egg (70 kcal) = 260 kcal.
    expect(
      draftLineNutrition(line(EDraftLineKind.MEAL, 10, 1.5), SOURCES).calories,
    ).toBe(390);
  });

  it('scales a 100 g Ingredient by grams / 100 and a piece by the count', () => {
    expect(
      draftLineNutrition(line(EDraftLineKind.INGREDIENT, 1, 250), SOURCES)
        .calories,
    ).toBe(950);
    expect(
      draftLineNutrition(line(EDraftLineKind.INGREDIENT, 2, 3), SOURCES)
        .protein,
    ).toBe(18);
  });

  it('counts an emptied quantity or an unpicked line as 0', () => {
    expect(
      draftLineNutrition(line(EDraftLineKind.MEAL, 10, null), SOURCES),
    ).toEqual(EMPTY_NUTRITION);
    expect(
      draftLineNutrition(line(EDraftLineKind.INGREDIENT, 0, 100), SOURCES),
    ).toEqual(EMPTY_NUTRITION);
  });
});

describe('draftNutrition', () => {
  it('sums its lines', () => {
    const total = draftNutrition(
      [line(EDraftLineKind.MEAL, 10, 2), line(EDraftLineKind.INGREDIENT, 2, 1)],
      SOURCES,
    );

    expect(total.calories).toBe(590);
    expect(total.protein).toBeCloseTo(31);
  });

  it('is all zeros without lines', () => {
    expect(draftNutrition([], SOURCES)).toEqual(EMPTY_NUTRITION);
  });
});

describe('formatCalorieDelta', () => {
  it('signs and rounds', () => {
    expect(formatCalorieDelta(620.4, 'en')).toBe('+620');
    expect(formatCalorieDelta(-150, 'en')).toBe('-150');
    expect(formatCalorieDelta(0.3, 'en')).toBe('0');
  });
});

describe('createDraftSchema', () => {
  const schema = createDraftSchema(en);
  const { validation } = en.draftMealPlan;

  const messages = (lines: TDraftLine[]) =>
    schema.safeParse({ lines }).error?.issues.map(({ message }) => message) ??
    [];

  it('accepts complete lines', () => {
    expect(
      messages([
        line(EDraftLineKind.MEAL, 10, 1.5),
        line(EDraftLineKind.INGREDIENT, 1, 37),
      ]),
    ).toEqual([]);
  });

  it('flags an unpicked line and an emptied quantity', () => {
    expect(messages([line(EDraftLineKind.INGREDIENT, 0, null)])).toEqual([
      validation.itemRequired,
      validation.quantityPositive,
    ]);
  });

  it('takes Meal multipliers in steps of 0.5', () => {
    expect(messages([line(EDraftLineKind.MEAL, 10, 1.25)])).toEqual([
      validation.multiplierStep,
    ]);
  });
});
