import { describe, expect, it } from 'vitest';

import { isNavItemActive } from '@/app/(modules)/dashboard/components/AppNav/nav.helpers';

describe('isNavItemActive', () => {
  it('marks the dashboard only on the dashboard', () => {
    expect(isNavItemActive('/dashboard', '/dashboard', '')).toBe(true);
    expect(isNavItemActive('/dashboard/meals', '/dashboard', '')).toBe(false);
  });

  it('marks a section on its sub-pages', () => {
    const href = '/dashboard/meals';

    expect(isNavItemActive(href, href, '/meals')).toBe(true);
    expect(isNavItemActive(`${href}/3`, href, '/meals')).toBe(true);
    expect(isNavItemActive('/dashboard/meal-plans', href, '/meals')).toBe(
      false,
    );
  });

  it('ignores the trailing slash of the static export', () => {
    expect(isNavItemActive('/dashboard/', '/dashboard', '')).toBe(true);
    expect(
      isNavItemActive('/dashboard/meals/', '/dashboard/meals', '/meals'),
    ).toBe(true);
    expect(isNavItemActive('/dashboard/meals/', '/dashboard', '')).toBe(false);
  });
});
