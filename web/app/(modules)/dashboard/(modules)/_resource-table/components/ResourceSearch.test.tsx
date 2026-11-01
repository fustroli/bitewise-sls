// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect, useState } from 'react';

import { EOrderDirection } from '@/app/utils/enums';
import ResourceSearch from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceSearch';
import { ResourceSearchProvider } from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceSearchProvider';
import { copy as en } from '@/app/copy';
import userEvent from '@testing-library/user-event';

// Like Next, a replace changes the URL, so the page re-renders with its search.
let navigate: (search: string | undefined) => void = () => {};
const replace = vi.fn((href: string) =>
  navigate(
    new URL(href, 'http://localhost').searchParams.get('search') ?? undefined,
  ),
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/dashboard/meals',
}));

const SORT = { orderBy: 'name', orderDirection: EOrderDirection.ASC };
const DEBOUNCE = 300;

const Page = ({ initialSearch }: { initialSearch?: string }) => {
  const [search, setSearch] = useState(initialSearch);
  useEffect(() => {
    navigate = setSearch;
  }, []);

  return (
    <ResourceSearchProvider search={search} sort={SORT}>
      <ResourceSearch resourceKey="meals" />
    </ResourceSearchProvider>
  );
};

const renderSearch = (search?: string) =>
  render(
    <>
      <Page initialSearch={search} />
    </>,
  );

const searchBox = () =>
  screen.getByRole<HTMLInputElement>('searchbox', {
    name: en.resources.meals.searchPlaceholder,
  });

const setup = () =>
  userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });

const wait = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  replace.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('ResourceSearch', () => {
  it('applies the term once typing pauses, on page 1 with the sort', async () => {
    const user = setup();
    renderSearch();

    await user.type(searchBox(), 'oats');
    expect(replace).not.toHaveBeenCalled();

    await wait(DEBOUNCE);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(
      '/dashboard/meals?page=1&orderBy=name&orderDirection=asc&search=oats',
      { scroll: false },
    );
  });

  it('applies the term right away on Enter', async () => {
    const user = setup();
    renderSearch();

    await user.type(searchBox(), 'rice{Enter}');
    expect(replace).toHaveBeenCalledWith(
      '/dashboard/meals?page=1&orderBy=name&orderDirection=asc&search=rice',
      { scroll: false },
    );

    await wait(DEBOUNCE);
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it('does not search again for the same term with extra spaces', async () => {
    const user = setup();
    renderSearch('oats');

    await user.type(searchBox(), '  ');
    await wait(DEBOUNCE);

    expect(replace).not.toHaveBeenCalled();
  });

  it('clears the search with the × button', async () => {
    const user = setup();
    renderSearch('oats');

    await user.click(
      screen.getByRole('button', { name: en.resourceTable.clearSearch }),
    );

    expect(searchBox().value).toBe('');
    expect(replace).toHaveBeenCalledWith(
      '/dashboard/meals?page=1&orderBy=name&orderDirection=asc',
      { scroll: false },
    );
    expect(
      screen.queryByRole('button', { name: en.resourceTable.clearSearch }),
    ).toBeNull();
  });

  it('clears the search on Escape', async () => {
    const user = setup();
    renderSearch('oats');

    await user.type(searchBox(), '{Escape}');

    expect(searchBox().value).toBe('');
    expect(replace).toHaveBeenCalledWith(
      '/dashboard/meals?page=1&orderBy=name&orderDirection=asc',
      { scroll: false },
    );
  });
});
