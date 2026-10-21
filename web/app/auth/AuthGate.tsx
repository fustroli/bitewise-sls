'use client';

import { DASHBOARD_PATH, SIGN_IN_PATH } from '@/app/auth/paths';
import { ReactNode, useEffect, useState } from 'react';

import { Hub } from 'aws-amplify/utils';
import { getCurrentUser } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';

interface IProps {
  /** The auth state the page is for: the dashboard's `true`, sign-in's `false`. */
  signedIn: boolean;
  children: ReactNode;
}

/**
 * Renders the page only in its auth state, otherwise sends the browser where
 * it belongs: a signed-out visitor to sign-in, a signed-in User to the
 * dashboard. Follows sign-in and sign-out as they happen (also in other tabs).
 * UX only: the API checks the token.
 */
const AuthGate = ({ signedIn, children }: IProps) => {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    const settle = (isSignedIn: boolean) => {
      if (!active) return;
      setAllowed(isSignedIn === signedIn);
      if (isSignedIn !== signedIn) {
        router.replace(signedIn ? SIGN_IN_PATH : DASHBOARD_PATH);
      }
    };

    // Waits for a Google sign-in still being completed.
    getCurrentUser().then(
      () => settle(true),
      () => settle(false),
    );
    const stopListening = Hub.listen('auth', ({ payload }) => {
      if (
        payload.event === 'signedIn' ||
        payload.event === 'signInWithRedirect'
      ) {
        settle(true);
      } else if (payload.event === 'signedOut') {
        settle(false);
      }
    });

    return () => {
      active = false;
      stopListening();
    };
  }, [signedIn, router]);

  return allowed ? children : null;
};

export default AuthGate;
