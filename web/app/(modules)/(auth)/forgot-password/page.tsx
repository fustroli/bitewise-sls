import AuthGate from '@/app/auth/AuthGate';
import ForgotPassword from '@/app/(modules)/(auth)/components/ForgotPassword';
import { Suspense } from 'react';

/** Resets a password with a mailed code; signs in with the new one. */
export default function ForgotPasswordPage() {
  return (
    <AuthGate signedIn={false}>
      <main className="flex h-screen flex-col items-center justify-center gap-10 px-8">
        <div className="text-2xl font-bold tracking-tight">
          BiteWise<span className="text-primary">.</span>
        </div>
        {/* `?email=` from the sign-in form needs a boundary in a static export. */}
        <Suspense>
          <ForgotPassword />
        </Suspense>
      </main>
    </AuthGate>
  );
}
