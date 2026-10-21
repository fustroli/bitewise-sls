import { Hub } from 'aws-amplify/utils';

// Whether the Google redirect came back with an error. Recorded from the
// start, since the exchange can fail before any page component mounts.
let failed = false;
const listeners = new Set<() => void>();

/** Starts recording a failed Google sign-in; called once with the config. */
export function listenForOAuthFailure() {
  Hub.listen('auth', ({ payload }) => {
    if (payload.event !== 'signInWithRedirect_failure') return;
    // The notice is generic; the cause (e.g. Cognito's `error_description`)
    // is only here.
    console.warn('Google sign-in failed', payload.data?.error);
    failed = true;
    listeners.forEach((listener) => listener());
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const oauthFailedStore = {
  subscribe,
  getSnapshot: () => failed,
  getServerSnapshot: () => false,
};
