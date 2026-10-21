// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ErrorFallback from '@/app/components/ErrorFallback';
import userEvent from '@testing-library/user-event';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

const SECRET = 'backend said: column users.password_hash missing';

const failure = (digest?: string) =>
  Object.assign(new Error(SECRET), digest ? { digest } : {});

describe('ErrorFallback', () => {
  it('hides the raw message in production and shows the digest', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(<ErrorFallback error={failure('abc123')} reset={() => {}} />);

    expect(screen.queryByText(SECRET)).toBeNull();
    expect(
      screen.getByText('An unexpected error occurred. Please try again.'),
    ).toBeTruthy();
    expect(screen.getByText('Error code: abc123')).toBeTruthy();
  });

  it('shows the raw message in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    render(<ErrorFallback error={failure()} reset={() => {}} />);

    expect(screen.getByText(SECRET)).toBeTruthy();
  });

  it('falls back to the generic text in development without a message', () => {
    vi.stubEnv('NODE_ENV', 'development');
    render(<ErrorFallback error={new Error('')} reset={() => {}} />);

    expect(
      screen.getByText('An unexpected error occurred. Please try again.'),
    ).toBeTruthy();
  });

  it('uses the given texts and calls reset on retry', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const reset = vi.fn();
    render(
      <ErrorFallback
        error={failure('d1')}
        reset={reset}
        texts={{
          title: 'Hiba',
          description: 'Általános hiba',
          errorCode: 'Hibakód',
          tryAgain: 'Újra',
        }}
      />,
    );

    expect(screen.getByText('Hiba')).toBeTruthy();
    expect(screen.getByText('Általános hiba')).toBeTruthy();
    expect(screen.getByText('Hibakód: d1')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Újra' }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
