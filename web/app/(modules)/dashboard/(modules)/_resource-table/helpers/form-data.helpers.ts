import { TResourceQuery } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';

/**
 * For a resource whose form needs no data: resolves at once, never refetches.
 * `null`, since a query may not resolve to `undefined`; the form ignores it.
 */
export const noFormDataQuery = <TFormData>(): TResourceQuery<TFormData> => ({
  queryKey: ['noFormData'],
  queryFn: () => null as TFormData,
  staleTime: Infinity,
});
