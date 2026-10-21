'use client';

import ErrorFallback from '@/app/components/ErrorFallback';
import { useDictionary } from '@/app/providers/dictionary-provider';

// Renders inside the dashboard layout, so the nav stays.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { errorBoundary } = useDictionary();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <ErrorFallback error={error} reset={reset} texts={errorBoundary} />
    </main>
  );
}
