import { signOut } from 'aws-amplify/auth';

export enum ESignOutReason {
  EXPIRED = 'expired',
  ACCOUNT_DELETED = 'account-deleted',
}

const REASON_KEY = 'bitewise:sign-out-reason';

/**
 * Ends the session on this device; Cognito revokes its refresh token.
 * `AuthGate` sends the browser to the sign-in page on Amplify's `signedOut`
 * event. A Google session first goes through Cognito's `/logout`, which comes
 * back to a bare `/`, so the reason travels in sessionStorage, not the URL.
 */
export async function endSession(reason?: ESignOutReason) {
  if (reason) {
    try {
      sessionStorage.setItem(REASON_KEY, reason);
    } catch {
      // Storage blocked: sign out without the notice.
    }
  }
  await signOut();
}

/** The last sign-out's reason; only known values survive. */
export function readSignOutReason(): ESignOutReason | undefined {
  try {
    const value = sessionStorage.getItem(REASON_KEY);
    return Object.values(ESignOutReason).find((reason) => reason === value);
  } catch {
    return undefined;
  }
}

/** Forgets the reason once shown, so a reload doesn't repeat it. */
export function clearSignOutReason() {
  try {
    sessionStorage.removeItem(REASON_KEY);
  } catch {
    // Storage blocked: nothing was stored.
  }
}
