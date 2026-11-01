import { IOption } from '@/app/utils/interfaces';

export const convertToOptions = (
  records: { id: string; name: string }[],
): IOption[] => {
  return records.map((record) => ({
    value: record.id,
    label: record.name,
  }));
};
