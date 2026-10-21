'use client';

import { useCallback, useSyncExternalStore } from 'react';

// `storage` fires only in other tabs, so writes from this one announce
// themselves with this event.
const LOCAL_CHANGE = 'local-storage-change';

const subscribe = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  window.addEventListener(LOCAL_CHANGE, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(LOCAL_CHANGE, onChange);
  };
};

const read = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * A localStorage item as a string: `undefined` until read on the client (on
 * the server and while hydrating), `null` when unset or storage is
 * unavailable. Setting `null` removes it; a failed write is ignored.
 */
export const useLocalStorage = (key: string) => {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => undefined,
  );

  const setValue = useCallback(
    (next: string | null) => {
      try {
        if (next === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, next);
        }
      } catch {
        // Private mode or a full quota: the value just isn't kept.
      }
      window.dispatchEvent(new Event(LOCAL_CHANGE));
    },
    [key],
  );

  return [value, setValue] as const;
};
