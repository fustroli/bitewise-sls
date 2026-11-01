import {
  buildPageHref,
  buildSearchHref,
  buildSortHref,
  getPageMetadata,
  toListQuery,
  toSuspenseKey,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/helpers/list-query.helpers';
import { describe, expect, it } from 'vitest';

import { EOrderDirection } from '@/app/utils/enums';
import { IResourceColumn } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';

const COLUMNS: IResourceColumn[] = [
  { id: 'name', sortable: true },
  { id: 'calories', sortable: false },
];

describe('toListQuery', () => {
  it('turns page and sort into limit, offset and order', () => {
    expect(
      toListQuery(
        { page: '3', orderBy: 'name', orderDirection: 'desc' },
        COLUMNS,
        10,
      ),
    ).toEqual({
      page: 3,
      sort: { orderBy: 'name', orderDirection: EOrderDirection.DESC },
      params: {
        limit: 10,
        offset: 20,
        orderBy: 'name',
        orderDirection: EOrderDirection.DESC,
      },
    });
  });

  it('starts on page 1, newest first, when the URL has nothing', () => {
    expect(toListQuery(undefined, COLUMNS, 5)).toEqual({
      page: 1,
      sort: { orderBy: undefined, orderDirection: undefined },
      params: {
        limit: 5,
        offset: 0,
        orderBy: 'createTimeStamp',
        orderDirection: EOrderDirection.DESC,
      },
    });
  });

  it.each(['0', '-2', 'abc', ''])('falls back to page 1 for "%s"', (page) => {
    expect(toListQuery({ page }, COLUMNS, 10).page).toBe(1);
  });

  it('ignores an unknown direction', () => {
    expect(
      toListQuery({ orderBy: 'name', orderDirection: 'sideways' }, COLUMNS, 10)
        .sort,
    ).toEqual({ orderBy: 'name', orderDirection: undefined });
  });

  it.each([
    ['an unknown column', 'foo'],
    ['a column that is not sortable', 'calories'],
    ['an injection attempt', 'name; DROP TABLE ingredient--'],
    ['a different case', 'Name'],
  ])('falls back to newest first for %s', (_, orderBy) => {
    const query = toListQuery(
      { orderBy, orderDirection: EOrderDirection.ASC },
      COLUMNS,
      10,
    );

    expect(query.sort).toEqual({
      orderBy: undefined,
      orderDirection: undefined,
    });
    expect(query.params).toMatchObject({
      orderBy: 'createTimeStamp',
      orderDirection: EOrderDirection.DESC,
    });
  });

  it('takes the first value of a repeated param', () => {
    expect(toListQuery({ page: ['2', '4'] }, COLUMNS, 10).page).toBe(2);
  });

  it('trims the search and sends it to the backend', () => {
    const query = toListQuery({ search: '  oats ' }, COLUMNS, 10);

    expect(query.search).toBe('oats');
    expect(query.params.search).toBe('oats');
  });

  it('caps the search at 100 characters', () => {
    const query = toListQuery({ search: 'a'.repeat(120) }, COLUMNS, 10);

    expect(query.search).toBe('a'.repeat(100));
    expect(query.params.search).toBe('a'.repeat(100));
  });

  it.each(['', '   ', undefined])('drops an empty search ("%s")', (search) => {
    const query = toListQuery({ search }, COLUMNS, 10);

    expect(query.search).toBeUndefined();
    expect(query.params).not.toHaveProperty('search');
  });
});

describe('getPageMetadata', () => {
  it.each([
    [1, 10, 25, { totalPages: 3, hasNextPage: true }],
    [3, 10, 25, { totalPages: 3, hasNextPage: false }],
    [2, 10, 20, { totalPages: 2, hasNextPage: false }],
    [1, 10, 0, { totalPages: 0, hasNextPage: false }],
  ])(
    'page %i of size %i with %i records',
    (page, pageSize, total, expected) => {
      expect(getPageMetadata(page, pageSize, total)).toEqual(expected);
    },
  );
});

describe('buildSortHref', () => {
  it('sorts a new column ascending', () => {
    expect(
      buildSortHref(
        { orderBy: 'name', orderDirection: EOrderDirection.DESC },
        'calories',
      ),
    ).toBe('?page=1&orderBy=calories&orderDirection=asc');
  });

  it('sorts ascending when nothing is sorted yet', () => {
    expect(buildSortHref({}, 'name')).toBe(
      '?page=1&orderBy=name&orderDirection=asc',
    );
  });

  it('flips the direction of the current column', () => {
    expect(
      buildSortHref(
        { orderBy: 'name', orderDirection: EOrderDirection.ASC },
        'name',
      ),
    ).toBe('?page=1&orderBy=name&orderDirection=desc');
    expect(
      buildSortHref(
        { orderBy: 'name', orderDirection: EOrderDirection.DESC },
        'name',
      ),
    ).toBe('?page=1&orderBy=name&orderDirection=asc');
  });

  it('keeps the search', () => {
    expect(buildSortHref({}, 'name', 'oats')).toBe(
      '?page=1&orderBy=name&orderDirection=asc&search=oats',
    );
  });
});

describe('buildPageHref', () => {
  it('keeps the sort', () => {
    expect(
      buildPageHref(4, {
        orderBy: 'name',
        orderDirection: EOrderDirection.ASC,
      }),
    ).toBe('?page=4&orderBy=name&orderDirection=asc');
  });

  it('leaves out a missing sort', () => {
    expect(buildPageHref(2, {})).toBe('?page=2');
  });

  it('keeps the search', () => {
    expect(buildPageHref(3, {}, 'rice bowl')).toBe('?page=3&search=rice+bowl');
  });

  it('leaves out an empty search', () => {
    expect(buildPageHref(2, {}, '  ')).toBe('?page=2');
  });
});

describe('buildSearchHref', () => {
  it('goes back to page 1 and keeps the sort', () => {
    expect(
      buildSearchHref(
        { orderBy: 'name', orderDirection: EOrderDirection.DESC },
        ' oats ',
      ),
    ).toBe('?page=1&orderBy=name&orderDirection=desc&search=oats');
  });

  it('drops the param when the search is cleared', () => {
    expect(buildSearchHref({}, '')).toBe('?page=1');
  });
});

describe('toSuspenseKey', () => {
  it('ignores the search', () => {
    expect(toSuspenseKey({ search: 'oats' }, COLUMNS)).toBe(
      toSuspenseKey({}, COLUMNS),
    );
  });

  it('treats a missing page as page 1', () => {
    expect(toSuspenseKey({ page: '1' }, COLUMNS)).toBe(
      toSuspenseKey(undefined, COLUMNS),
    );
  });

  it('ignores a sort on a column that is not sortable', () => {
    expect(toSuspenseKey({ orderBy: 'calories' }, COLUMNS)).toBe(
      toSuspenseKey({}, COLUMNS),
    );
  });

  it('changes with the page and sort', () => {
    expect(toSuspenseKey({ page: '2' }, COLUMNS)).not.toBe(
      toSuspenseKey({}, COLUMNS),
    );
    expect(toSuspenseKey({ orderBy: 'name' }, COLUMNS)).not.toBe(
      toSuspenseKey({}, COLUMNS),
    );
  });
});
