'use client';

import { Alert, AlertDescription } from '@/app/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';

import ConfirmSignUp from '@/app/(modules)/(auth)/components/ConfirmSignUp';
import { EAuthView } from '@/app/(modules)/(auth)/enum';
import GoogleSignIn from '@/app/(modules)/(auth)/components/GoogleSignIn';
import { ISignIn } from '@/app/(modules)/(auth)/interfaces';
import { Separator } from '@/app/components/ui/separator';
import SignInForm from '@/app/(modules)/(auth)/components/SignInForm';
import SignUpForm from '@/app/(modules)/(auth)/components/SignUpForm';
import { resendSignUpCode } from 'aws-amplify/auth';
import { useState } from 'react';

interface IProps {
  /** Shown above the form, e.g. why the previous session ended. */
  notice?: string;
}

interface IPendingConfirmation {
  credentials: ISignIn;
  codeSent: boolean;
}

const AuthForm = ({ notice }: IProps) => {
  // An account waiting for its email code: the code step replaces the tabs.
  const [pending, setPending] = useState<IPendingConfirmation | null>(null);

  const confirmAfterSignUp = (credentials: ISignIn) =>
    setPending({ credentials, codeSent: true });

  // Signing in to an unconfirmed account sends no code by itself.
  const confirmAfterSignIn = async (credentials: ISignIn) => {
    let codeSent = true;
    try {
      await resendSignUpCode({ username: credentials.email });
    } catch {
      // Throttled or failed: the code step still offers Resend.
      codeSent = false;
    }
    setPending({ credentials, codeSent });
  };

  return (
    <section className="md:max-w-4/5 flex h-screen flex-col items-center justify-around px-8 md:mx-auto xl:max-h-[704px] xl:rounded-l-lg xl:border xl:bg-card xl:px-16">
      <div className="text-2xl font-bold tracking-tight">
        BiteWise<span className="text-primary">.</span>
      </div>
      <h1 className="text-2xl font-bold xl:text-3xl">Welcome Back</h1>
      <div>Welcome back, please enter your details</div>
      {notice && (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      {pending ? (
        <ConfirmSignUp
          credentials={pending.credentials}
          codeSent={pending.codeSent}
          onBack={() => setPending(null)}
        />
      ) : (
        <div className="flex flex-col gap-10">
          <Tabs defaultValue={EAuthView.SIGN_IN}>
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value={EAuthView.SIGN_IN}>Sign In</TabsTrigger>
              <TabsTrigger value={EAuthView.SIGN_UP}>Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value={EAuthView.SIGN_IN}>
              <SignInForm onConfirmSignUp={confirmAfterSignIn} />
            </TabsContent>
            <TabsContent value={EAuthView.SIGN_UP}>
              <SignUpForm onConfirmSignUp={confirmAfterSignUp} />
            </TabsContent>
          </Tabs>
          <div className="flex w-full items-center">
            <Separator className="shrink" />
            <p className="mx-4 shrink-0">Or continue with</p>
            <Separator className="shrink" />
          </div>
          <GoogleSignIn />
        </div>
      )}
      <div className="text-center text-xs">
        BiteWise is your smart meal planner: combine your ingredients into
        meals, group meals into meal plans, and see the nutrition of each.
      </div>
    </section>
  );
};

export default AuthForm;
