import { IQueryParams } from '@/app/utils/interfaces';

export const buildQueryParams = (params: IQueryParams) => {
  if (!params) return '';
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, value.toString());
    }
  });

  return query.toString();
};
