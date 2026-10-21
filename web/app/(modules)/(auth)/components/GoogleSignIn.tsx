'use client';

import { Button } from '@/app/components/ui/button';
import GoogleIcon from '@/app/components/icons/GoogleIcon';
import { authErrorMessage } from '@/app/auth/errors';
import { signInWithRedirect } from 'aws-amplify/auth';
import { useToast } from '@/app/hooks/use-toast';

/**
 * Sends the browser to Google through Cognito; Cognito comes back to `/`
 * with `?code=`, which Amplify redeems (`AuthGate` then moves on).
 */
const GoogleSignIn = () => {
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      await signInWithRedirect({ provider: 'Google' });
    } catch (error) {
      toast({ variant: 'error', description: authErrorMessage(error) });
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full border bg-card [&_svg]:fill-current"
      onClick={handleClick}
    >
      <GoogleIcon />
      Google
    </Button>
  );
};

export default GoogleSignIn;
