// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { renderHook } from '@testing-library/react';
import { useSettledValue } from '@/app/hooks/use-settled-value';

describe('useSettledValue', () => {
  it('is the value while settled, and the last settled one while not', () => {
    const { result, rerender } = renderHook(
      ({ value, settled }) => useSettledValue(value, settled),
      { initialProps: { value: 1, settled: true } },
    );
    expect(result.current).toBe(1);

    rerender({ value: 2, settled: false });
    expect(result.current).toBe(1);

    rerender({ value: 3, settled: true });
    expect(result.current).toBe(3);
  });

  it('is unset until first settled', () => {
    const { result } = renderHook(() => useSettledValue(1, false));

    expect(result.current).toBeUndefined();
  });
});
