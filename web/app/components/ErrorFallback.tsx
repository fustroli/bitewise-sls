'use client';

import { Button } from '@/app/components/ui/button';

export interface IErrorFallbackTexts {
  title: string;
  description: string;
  errorCode: string;
  tryAgain: string;
}

// Error boundaries use this text by default.
export const DEFAULT_ERROR_FALLBACK_TEXTS: IErrorFallbackTexts = {
  title: 'Something went wrong!',
  description: 'An unexpected error occurred. Please try again.',
  errorCode: 'Error code',
  tryAgain: 'Try again',
};

/**
 * The card an error boundary shows. The raw error message can carry backend
 * or client details, so it is shown only in development; production shows the
 * generic description and the digest for a support lookup.
 */
export default function ErrorFallback({
  error,
  reset,
  texts = DEFAULT_ERROR_FALLBACK_TEXTS,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  texts?: IErrorFallbackTexts;
}) {
  const showMessage =
    process.env.NODE_ENV === 'development' && Boolean(error.message);

  return (
    <div className="max-w-md rounded-lg border bg-card p-6">
      <h2 className="mb-4 text-2xl font-semibold text-destructive">
        {texts.title}
      </h2>
      <p className="mb-6 text-foreground">
        {showMessage ? error.message : texts.description}
      </p>
      {error.digest && (
        <p className="mb-6 text-sm text-muted-foreground">
          {texts.errorCode}: {error.digest}
        </p>
      )}
      <Button onClick={() => reset()} className="w-full">
        {texts.tryAgain}
      </Button>
    </div>
  );
}
