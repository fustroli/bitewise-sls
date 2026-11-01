'use client';

import LoadingButton from '@/app/components/buttons/LoadingButton';
import { LogOut } from 'lucide-react';
import { cn } from '@/app/lib';
import { endSession } from '@/app/auth/sign-out';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useState } from 'react';

interface IProps {
  className?: string;
}

/** Ends the session on this device; `AuthGate` then leaves the dashboard. */
const SignOutButton = ({ className }: IProps) => {
  const label = useDictionary().dashboard.appbar.logout;
  const [isLoading, setIsLoading] = useState(false);

  const signOut = async () => {
    setIsLoading(true);
    await endSession();
  };

  return (
    <LoadingButton
      type="button"
      variant="outline"
      loading={isLoading}
      onClick={signOut}
      className={cn(
        'w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive',
        className,
      )}
    >
      <LogOut aria-hidden />
      {label}
    </LoadingButton>
  );
};

export default SignOutButton;
