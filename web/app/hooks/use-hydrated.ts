'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` on the server and while this component hydrates, `true` after.
 * Unlike a value read once higher up, it holds per Suspense boundary, which
 * can hydrate later than its parents.
 */
export const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
