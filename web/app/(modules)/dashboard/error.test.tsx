// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import DashboardError from '@/app/(modules)/dashboard/error';
import { copy } from '@/app/copy';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('dashboard error boundary', () => {
  it('shows the generic text and digest in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(
      <DashboardError
        error={Object.assign(new Error('raw API detail'), { digest: 'xyz' })}
        reset={() => {}}
      />,
    );

    expect(screen.queryByText('raw API detail')).toBeNull();
    expect(screen.getByText(copy.errorBoundary.title)).toBeTruthy();
    expect(screen.getByText(copy.errorBoundary.description)).toBeTruthy();
    expect(
      screen.getByText(`${copy.errorBoundary.errorCode}: xyz`),
    ).toBeTruthy();
  });
});
