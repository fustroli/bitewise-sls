import { IOption } from '@/app/utils/interfaces';

export const convertToOptions = (
  records: { id: number; name: string }[],
): IOption[] => {
  return records.map((record) => ({
    value: record.id,
    label: record.name,
  }));
};
