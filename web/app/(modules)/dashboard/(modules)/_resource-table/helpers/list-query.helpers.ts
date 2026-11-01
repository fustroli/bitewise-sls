import {
  DEFAULT_SORT,
  MAX_SEARCH_LENGTH,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/constants';
import {
  IListQuery,
  IPageMetadata,
  IResourceColumn,
  ISortState,
  TSearchParams,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { EOrderDirection } from '@/app/utils/enums';
import { FIRST_PAGE } from '@/app/utils/constants';

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const parsePage = (value: string | undefined) => {
  const page = Math.floor(Number(value));
  return Number.isFinite(page) && page >= FIRST_PAGE ? page : FIRST_PAGE;
};

const parseDirection = (value: string | undefined) =>
  Object.values(EOrderDirection).find((direction) => direction === value);

/** Trims and caps a search term; an empty one is no search. */
export const normalizeSearch = (value: string | undefined) =>
  value?.trim().slice(0, MAX_SEARCH_LENGTH).trim() || undefined;

/**
 * Keeps the sort only when it names one of the table's sortable columns;
 * anything else is no sort, so the list falls back to `DEFAULT_SORT`.
 */
const parseSort = (
  searchParams: TSearchParams | undefined,
  columns: IResourceColumn[],
): ISortState => {
  const orderBy = first(searchParams?.orderBy);
  const isSortable = columns.some(
    (column) => column.sortable && column.id === orderBy,
  );

  return isSortable
    ? {
        orderBy,
        orderDirection: parseDirection(first(searchParams?.orderDirection)),
      }
    : { orderBy: undefined, orderDirection: undefined };
};

/**
 * Reads page, sort and search from the URL and turns them into a backend
 * query. With no column sorted, the backend gets `DEFAULT_SORT`.
 */
export const toListQuery = (
  searchParams: TSearchParams | undefined,
  columns: IResourceColumn[],
  pageSize: number,
): IListQuery => {
  const page = parsePage(first(searchParams?.page));
  const sort = parseSort(searchParams, columns);
  const search = normalizeSearch(first(searchParams?.search));

  return {
    page,
    sort,
    search,
    params: {
      limit: pageSize,
      offset: (page - FIRST_PAGE) * pageSize,
      ...(sort.orderBy ? sort : DEFAULT_SORT),
      ...(search && { search }),
    },
  };
};

export const getPageMetadata = (
  page: number,
  pageSize: number,
  total: number,
): IPageMetadata => ({
  totalPages: Math.ceil(total / pageSize),
  hasNextPage: page * pageSize < total,
});

export const buildPageHref = (
  page: number,
  sort: ISortState,
  search?: string,
) => {
  const query = new URLSearchParams({ page: String(page) });
  const term = normalizeSearch(search);

  if (sort.orderBy) query.set('orderBy', sort.orderBy);
  if (sort.orderDirection) query.set('orderDirection', sort.orderDirection);
  if (term) query.set('search', term);

  return `?${query}`;
};

/**
 * A new column sorts ascending; the current column flips direction. Either
 * way the list goes back to the first page.
 */
export const buildSortHref = (
  sort: ISortState,
  columnId: string,
  search?: string,
) => {
  const isAscending =
    sort.orderBy === columnId && sort.orderDirection === EOrderDirection.ASC;

  return buildPageHref(
    FIRST_PAGE,
    {
      orderBy: columnId,
      orderDirection: isAscending ? EOrderDirection.DESC : EOrderDirection.ASC,
    },
    search,
  );
};

/** A new search term keeps the sort and goes back to the first page. */
export const buildSearchHref = (sort: ISortState, search: string | undefined) =>
  buildPageHref(FIRST_PAGE, sort, search);

/**
 * Changes with the page or sort, so Suspense shows the skeleton again. Search
 * is left out: while a search loads, the old rows stay (dimmed) instead.
 */
export const toSuspenseKey = (
  searchParams: TSearchParams | undefined,
  columns: IResourceColumn[],
) =>
  JSON.stringify({
    page: parsePage(first(searchParams?.page)),
    ...parseSort(searchParams, columns),
  });
