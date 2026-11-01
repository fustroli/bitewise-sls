import { EOrderDirection } from '@/app/utils/enums';
import { IQueryParams } from '@/app/utils/interfaces';

export type TSearchParams = Record<string, string | string[] | undefined>;

export interface ISortState {
  orderBy?: string;
  orderDirection?: EOrderDirection;
}

export interface IListQuery {
  page: number;
  sort: ISortState;
  /** The trimmed, capped search term; unset when empty. */
  search?: string;
  params: IQueryParams;
}

export interface IPageMetadata {
  totalPages: number;
  hasNextPage: boolean;
}
