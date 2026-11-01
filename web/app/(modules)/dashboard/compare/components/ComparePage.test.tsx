// @vitest-environment jsdom
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import ComparePage from '@/app/(modules)/dashboard/compare/components/ComparePage';
import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import { EMPTY_NUTRITION } from '@/app/(modules)/dashboard/(modules)/_nutrition/constants';
import { IUser } from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { ME_KEY } from '@/app/(modules)/dashboard/(modules)/_user/queries';
import { TestQueryProvider } from '@/app/utils/testing/test-query-provider';
import { UserProvider } from '@/app/(modules)/dashboard/(modules)/_user/provider';
import { copy as en } from '@/app/copy';
import userEvent from '@testing-library/user-event';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/compare',
  useRouter: () => ({ replace }),
}));
const fetchIngredientsByIds = vi.fn();
vi.mock('@/app/(modules)/dashboard/(modules)/ingredients/queries', () => ({
  fetchIngredientsByIds: (ids: string[]) => fetchIngredientsByIds(ids),
}));
vi.mock('@/app/(modules)/dashboard/(modules)/meals/queries', () => ({
  fetchMealsByIds: vi.fn(),
}));
vi.mock('@/app/(modules)/dashboard/(modules)/meal-plans/queries', () => ({
  fetchMealPlansByIds: vi.fn(),
}));

const labels = en.comparison;

/** A ULID for a small test number, so cases read as numbers. */
const id = (n: number) =>
  `01JAZ3Q8V6X2M5N7P9R1S3T${String(n).padStart(3, '0')}`;

const item = (n: number, name: string, calories: number, protein = 10) => ({
  ...EMPTY_NUTRITION,
  id: id(n),
  name,
  unit: '100g',
  calories,
  protein,
});

const INGREDIENTS = [
  item(1, 'Oats', 379, 13.2),
  item(2, 'Rice', 130, 2.7),
  item(3, 'Egg', 72, 6.3),
];

const OPTIONS = {
  [EComparisonKind.INGREDIENTS]: INGREDIENTS,
  [EComparisonKind.MEALS]: [
    { ...item(9, 'Bowl', 630), unit: undefined, parts: 4 },
  ],
  [EComparisonKind.MEAL_PLANS]: [],
};

const USER: IUser = { id: 'user-sub', email: 'user@example.com' };

/** The URL's picks, by test number; `null` is an empty slot. */
const renderPage = (picks: (number | null)[]) =>
  render(
    <TestQueryProvider seed={[[ME_KEY, USER]]}>
      <UserProvider actions={{ updateUser: vi.fn() }}>
        <ComparePage
          initial={{
            kind: EComparisonKind.INGREDIENTS,
            ids: picks.map((n) => (n === null ? null : id(n))),
          }}
          options={OPTIONS}
        />
      </UserProvider>
    </TestQueryProvider>,
  );

/** The nutrient table, once its section shows. */
const shownNutrientTable = async () => {
  await screen.findByRole('heading', { name: labels.nutrients.title });
  return nutrientTable();
};

const nutrientTable = () =>
  within(
    screen
      .getByRole('heading', { name: labels.nutrients.title })
      .closest('section')!,
  );

beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.scrollIntoView = () => {};
  // cmdk (the slot pickers' search list) observes its size.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe('ComparePage', () => {
  beforeEach(() => {
    // The API has every Ingredient asked for.
    fetchIngredientsByIds.mockImplementation(async (ids: string[]) => ({
      ok: true,
      data: INGREDIENTS.filter((ingredient) => ids.includes(ingredient.id)),
    }));
  });

  afterEach(() => {
    cleanup();
    replace.mockClear();
    fetchIngredientsByIds.mockReset();
  });

  it('asks for a baseline until one is picked', () => {
    renderPage([]);

    expect(screen.getByText(labels.pickPrompt)).toBeTruthy();
  });

  it('shows differences from the baseline', async () => {
    renderPage([1, 2]);
    const table = await shownNutrientTable();

    expect(table.getAllByText('−249 kcal').length).toBeGreaterThan(0);
    expect(table.getAllByText('−10.5 g').length).toBeGreaterThan(0);
  });

  it('says "same" for the same item twice', async () => {
    renderPage([1, 1]);

    const table = await shownNutrientTable();
    expect(table.getAllByText(labels.nutrients.same).length).toBe(
      // 7 rows, desktop table and phone list.
      14,
    );
  });

  it('hides the differences on request', async () => {
    const user = userEvent.setup();
    renderPage([1, 2]);
    await shownNutrientTable();

    await user.click(
      screen.getByRole('checkbox', { name: labels.nutrients.showDifferences }),
    );

    expect(nutrientTable().queryByText('−249 kcal')).toBeNull();
  });

  it('puts a picked item in the URL', async () => {
    const user = userEvent.setup();
    renderPage([1]);

    await user.click(screen.getByRole('combobox', { name: /Item 2/ }));
    await user.click(screen.getByRole('option', { name: 'Egg' }));

    expect(replace).toHaveBeenLastCalledWith(
      `/dashboard/compare?type=ingredients&ids=${id(1)}%2C${id(3)}`,
      { scroll: false },
    );
  });

  it('keeps each kind its own picks', async () => {
    const user = userEvent.setup();
    renderPage([1, 2]);

    const [kindSwitch] = screen.getAllByRole('radiogroup', {
      name: labels.kindLabel,
    });
    await user.click(
      within(kindSwitch).getByRole('radio', { name: labels.kinds.meals }),
    );
    expect(screen.getByText(labels.empty.meals)).toBeTruthy();

    await user.click(
      within(kindSwitch).getByRole('radio', { name: labels.kinds.ingredients }),
    );
    expect(replace).toHaveBeenLastCalledWith(
      `/dashboard/compare?type=ingredients&ids=${id(1)}%2C${id(2)}`,
      { scroll: false },
    );
  });

  it('fetches a picked item it has not loaded yet', async () => {
    const user = userEvent.setup();
    renderPage([1]);

    await user.click(screen.getByRole('combobox', { name: /Item 2/ }));
    await user.click(screen.getByRole('option', { name: 'Egg' }));

    expect(
      (await shownNutrientTable()).getAllByText('−307 kcal').length,
    ).toBeGreaterThan(0);
    expect(fetchIngredientsByIds).toHaveBeenLastCalledWith([id(3)]);
  });

  it('leaves a slot empty when its item is gone', async () => {
    fetchIngredientsByIds.mockResolvedValue({ ok: true, data: [] });
    renderPage([2]);

    expect(await screen.findByText(labels.pickPrompt)).toBeTruthy();
  });
});
