'use client';

import { Alert, AlertDescription } from '@/app/components/ui/alert';
import {
  TForgotPasswordSchema,
  TResetPasswordSchema,
  createResetPasswordSchema,
  forgotPasswordSchema,
} from '@/app/(modules)/(auth)/validations';
import { confirmResetPassword, resetPassword, signIn } from 'aws-amplify/auth';
import { useMemo, useState } from 'react';

import { Form } from '@/app/components/ui/form';
import InputField from '@/app/components/form/InputField';
import Link from 'next/link';
import LoadingButton from '@/app/components/buttons/LoadingButton';
import PasswordInput from '@/app/components/form/PasswordInput';
import ResendCodeButton from '@/app/auth/ResendCodeButton';
import { authErrorMessage } from '@/app/auth/errors';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/app/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Asks Cognito to mail a reset code, then takes the code and a new password
 * on the same page and signs in with it (`AuthGate` moves on to the
 * dashboard). Cognito answers the same for unknown addresses, so "sent" says
 * nothing about the account.
 */
const ForgotPassword = () => {
  const {
    passwordReset: text,
    passwordPolicy,
    emailVerification,
  } = useDictionary();
  const { toast } = useToast();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const requestForm = useForm<TForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: useSearchParams().get('email') ?? '' },
  });

  const resetSchema = useMemo(
    () =>
      createResetPasswordSchema({
        ...passwordPolicy,
        codeRequired: text.codeRequired,
      }),
    [passwordPolicy, text.codeRequired],
  );
  const resetForm = useForm<TResetPasswordSchema>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: '', password: '', confirmPassword: '' },
  });

  const sendCode = async (email: string) => {
    try {
      await resetPassword({ username: email });
      setSentTo(email);
      return true;
    } catch (error) {
      toast({ variant: 'error', description: authErrorMessage(error) });
      return false;
    }
  };

  async function onReset({ code, password }: TResetPasswordSchema) {
    if (!sentTo) return;
    try {
      await confirmResetPassword({
        username: sentTo,
        confirmationCode: code,
        newPassword: password,
      });
      await signIn({ username: sentTo, password });
    } catch (error) {
      toast({ variant: 'error', description: authErrorMessage(error) });
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <h1 className="text-center text-2xl font-bold">
        {sentTo ? text.resetTitle : text.forgotTitle}
      </h1>
      {sentTo ? (
        <>
          <Alert>
            <AlertDescription role="status">
              {interpolate(text.sent, { email: sentTo })}
            </AlertDescription>
          </Alert>
          <Form {...resetForm}>
            <form
              className="flex w-full flex-col gap-8"
              onSubmit={resetForm.handleSubmit(onReset)}
            >
              <InputField
                control={resetForm.control}
                label={text.code}
                name="code"
                autoComplete="one-time-code"
                inputMode="numeric"
              />
              <PasswordInput
                control={resetForm.control}
                label={text.newPassword}
                name="password"
              />
              <PasswordInput
                control={resetForm.control}
                label={text.confirmPassword}
                name="confirmPassword"
              />
              <LoadingButton
                className="w-full"
                type="submit"
                loading={resetForm.formState.isSubmitting}
              >
                {text.updatePassword}
              </LoadingButton>
            </form>
          </Form>
          <ResendCodeButton
            onResend={() => sendCode(sentTo)}
            label={text.resend}
            waitLabel={emailVerification.resendIn}
            startCooledDown
          />
        </>
      ) : (
        <>
          <p className="text-center">{text.forgotIntro}</p>
          <Form {...requestForm}>
            <form
              className="flex w-full flex-col gap-8"
              onSubmit={requestForm.handleSubmit(({ email }) =>
                sendCode(email),
              )}
            >
              <InputField
                control={requestForm.control}
                label={text.email}
                name="email"
                type="email"
                autoComplete="username"
              />
              <LoadingButton
                className="w-full"
                type="submit"
                loading={requestForm.formState.isSubmitting}
              >
                {text.sendCode}
              </LoadingButton>
            </form>
          </Form>
        </>
      )}
      <Link href="/" className="text-center text-sm underline">
        {text.backToSignIn}
      </Link>
    </div>
  );
};

export default ForgotPassword;
