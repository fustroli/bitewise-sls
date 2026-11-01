import { ComponentType, ReactNode } from 'react';
import {
  IResourceDialogProps,
  IResourceRecord,
  IResourceRowActionsProps,
  TResourceKey,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces/resource-form.interface';

import { IQueryParams } from '@/app/utils/interfaces';
import { TDictionary } from '@/app/providers/dictionary-provider';
import { UseSuspenseQueryOptions } from '@tanstack/react-query';

export interface IResourceColumn {
  id: string;
  sortable: boolean;
  align?: 'justify-start' | 'justify-center' | 'justify-end';
  /** A macro's colour square before the header text. */
  swatch?: 'protein' | 'carbs' | 'fat';
}

/** The strings every resource has under `resources.<key>` in the dictionary. */
export interface IResourceLabels {
  title: string;
  /** The page header's one-line description. */
  description: string;
  /** The header's link to the Compare page, e.g. "Compare meals". */
  compare: string;
  empty: string;
  /** Shown when a search finds nothing; `{term}` is the search term. */
  noMatch: string;
  searchPlaceholder: string;
  addTitle: string;
  editTitle: string;
  deleteTitle: string;
  columns: Record<string, string>;
}

export interface IResourceRowContext {
  /** For a resource's own strings, e.g. `resources.meals.…`. */
  dictionary: TDictionary;
  labels: IResourceLabels;
  tableLabels: TDictionary['resourceTable'];
  /** The row-actions menu (Edit, Duplicate, Delete, …). */
  actions: ReactNode;
  /** The Edit dialog behind a plain button, for phone layouts. */
  edit: ReactNode;
  /** The Compare page with this record as the baseline. */
  compareHref: string;
  lang: string;
}

export interface IResourcePage<TRecord> {
  data: TRecord[];
  count: number;
}

/** A query the list suspends on until its data is in. */
export type TResourceQuery<TData> = UseSuspenseQueryOptions<
  TData,
  Error,
  TData,
  any
>;

/**
 * How a resource's list page loads and renders. `dialog` and `rowActions`
 * come from its form (`createResourceForm`).
 */
export interface IResourceList<
  TRecord extends IResourceRecord,
  TFormData = undefined,
> {
  resourceKey: TResourceKey;
  listQuery: (params: IQueryParams) => TResourceQuery<IResourcePage<TRecord>>;
  /**
   * `table`: rows in a card, sortable by the columns' headers. `cards`: a grid
   * of `renderRow`'s cards; `columns` then only lists what may be sorted by.
   */
  layout: 'table' | 'cards';
  /** Data columns; the module appends the actions column. */
  columns: IResourceColumn[];
  /** A `<TableRow>` for `table`, a card for `cards`. */
  renderRow: (row: TRecord, context: IResourceRowContext) => ReactNode;
  /** `table` only: an `<li>` that replaces the table below `md`. */
  renderMobileRow?: (row: TRecord, context: IResourceRowContext) => ReactNode;
  /** `cards` only: the grid's classes. */
  gridClassName?: string;
  /** Right under the page header, e.g. a phone-only switch to a sibling page. */
  header?: ComponentType;
  /** Next to the search bar, e.g. a legend. */
  toolbar?: ComponentType;
  /** The Compare page's `type` for this resource. */
  compareType: string;
  /** Shows a search bar that filters the list by name. */
  searchable?: boolean;
  /** Defaults to `DEFAULT_PAGE_SIZE`. */
  pageSize?: number;
  /** The data the add/edit form needs, e.g. the Ingredient options. */
  formDataQuery?: TResourceQuery<TFormData>;
  dialog: ComponentType<IResourceDialogProps<TRecord, TFormData>>;
  rowActions: ComponentType<IResourceRowActionsProps<TRecord, TFormData>>;
}
