'use client';

import { interpolate, pluralize } from '@/app/utils/helpers';

import { LOCALE } from '@/app/copy';
import { useDictionary } from '@/app/providers/dictionary-provider';

interface IProps {
  /** The planned days an action would replace, Monday first. */
  days: number[];
  /** Monday to Sunday. */
  names: string[];
}

/** Says up front which planned days an action overwrites; nothing for none. */
const ReplacesWarning = ({ days, names }: IProps) => {
  const labels = useDictionary().weekPlan;
  const lang = LOCALE;

  if (!days.length) return null;

  return (
    <p role="status" className="text-sm font-semibold text-warning">
      {interpolate(pluralize(days.length, labels.replaces, lang), {
        days: new Intl.ListFormat(lang).format(days.map((day) => names[day])),
      })}
    </p>
  );
};

export default ReplacesWarning;
