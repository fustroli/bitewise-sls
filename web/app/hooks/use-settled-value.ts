'use client';

import { useState } from 'react';

/**
 * `value` while `settled`, else the last value seen settled (`undefined` if
 * none yet): what was right a moment ago, instead of a half-loaded one. Pass
 * a memoized `value`, since a new one each render would update each render.
 */
export const useSettledValue = <T>(value: T, settled: boolean) => {
  const [kept, setKept] = useState<T | undefined>(settled ? value : undefined);
  if (settled && kept !== value) setKept(value);

  return settled ? value : kept;
};
