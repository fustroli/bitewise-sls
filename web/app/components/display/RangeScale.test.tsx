// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import RangeScale from '@/app/components/display/RangeScale';

const ZONES = [
  { label: 'Under', from: 15, to: 18.5, className: 'bg-zone-low' },
  { label: 'Normal', from: 18.5, to: 25, className: 'bg-zone-normal' },
];

const markerLeft = (value: number) => {
  render(
    <RangeScale
      zones={ZONES}
      value={value}
      min={15}
      max={25}
      ticks={[{ value: 18.5, label: '18.5' }]}
      valueLabel="Your BMI"
    />,
  );
  return screen.getByRole('img', { name: 'Your BMI' }).style.left;
};

describe('RangeScale', () => {
  afterEach(cleanup);

  it('places the marker at the value', () => {
    expect(markerLeft(20)).toBe('50%');
  });

  it.each([
    [42, '100%'],
    [3, '0%'],
  ])('clamps %d to the end of the bar', (value, left) => {
    expect(markerLeft(value)).toBe(left);
  });
});
