'use client';

import ErrorFallback from '@/app/components/ErrorFallback';

// ErrorFallback's default text.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <ErrorFallback error={error} reset={reset} />
    </main>
  );
}
