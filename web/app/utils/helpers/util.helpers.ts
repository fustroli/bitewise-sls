export const makeStringReadable = (str: string): string => {
  const res = str.replace(/_/g, ' ').toLowerCase();
  return res.charAt(0).toUpperCase() + res.slice(1);
};

/** Replaces `{key}` placeholders in a dictionary string. */
export const interpolate = (
  template: string,
  values: Record<string, string | number>,
): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );

export interface IPluralForms {
  one: string;
  other: string;
}

/** The form for `count` in the locale (e.g. "1 ingredient" / "3 ingredients"). */
export const pluralize = (
  count: number,
  forms: IPluralForms,
  locale: string,
): string =>
  interpolate(
    new Intl.PluralRules(locale).select(count) === 'one'
      ? forms.one
      : forms.other,
    { count },
  );
