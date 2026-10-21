'use client';

import AuthGate from '@/app/auth/AuthGate';
import { Button } from '@/app/components/ui/button';
import { endSession } from '@/app/auth/sign-out';

// Auth check; the dashboard shell replaces it in port step 4.
export default function Dashboard() {
  return (
    <AuthGate signedIn>
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
        <h1 className="text-3xl font-bold text-primary">Signed in</h1>
        <Button onClick={() => endSession()}>Sign out</Button>
      </main>
    </AuthGate>
  );
}
