'use client';

import {
  ESignOutReason,
  clearSignOutReason,
  readSignOutReason,
} from '@/app/auth/sign-out';
import { useEffect, useState, useSyncExternalStore } from 'react';

import AuthForm from '@/app/(modules)/(auth)/components/AuthForm';
import AuthImageFrame from '@/app/(modules)/(auth)/components/AuthImageFrame';
import { oauthFailedStore } from '@/app/auth/oauth';
import { useDictionary } from '@/app/providers/dictionary-provider';

const AuthPage = () => {
  const { auth } = useDictionary();
  // Client-only: `AuthGate` renders the page after it mounts.
  const [reason] = useState(readSignOutReason);
  const oauthFailed = useSyncExternalStore(
    oauthFailedStore.subscribe,
    oauthFailedStore.getSnapshot,
    oauthFailedStore.getServerSnapshot,
  );

  useEffect(clearSignOutReason, []);

  const reasonNotices: Record<ESignOutReason, string> = {
    [ESignOutReason.EXPIRED]: auth.sessionExpired,
    [ESignOutReason.ACCOUNT_DELETED]: auth.accountDeleted,
  };
  const notice = oauthFailed
    ? auth.oauthFailed
    : reason && reasonNotices[reason];

  return (
    <div className="flex h-screen flex-col xl:mx-auto xl:max-w-[1408px] xl:flex-row xl:items-center">
      <AuthForm notice={notice} />
      <AuthImageFrame />
    </div>
  );
};

export default AuthPage;
