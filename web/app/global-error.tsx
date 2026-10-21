'use client';

import ErrorFallback from '@/app/components/ErrorFallback';

// Replaces the root layout; ErrorFallback's default text.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background">
        <ErrorFallback error={error} reset={reset} />
      </body>
    </html>
  );
}
