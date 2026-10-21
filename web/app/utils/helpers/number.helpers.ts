/** Rounds only for display: up to `maxDecimals`, no trailing zeros, e.g. `3.6`. */
export const formatAmount = (value: number, locale: string, maxDecimals = 1) =>
  value.toLocaleString(locale, { maximumFractionDigits: maxDecimals });
