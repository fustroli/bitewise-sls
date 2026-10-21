'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  TSignInSchema,
  signinSchema,
} from '@/app/(modules)/(auth)/validations';

import { Button } from '@/app/components/ui/button';
import { ESignInSteps } from '@/app/(modules)/(auth)/enum';
import { Form } from '@/app/components/ui/form';
import { ISignIn } from '@/app/(modules)/(auth)/interfaces';
import InputField from '@/app/components/form/InputField';
import Link from 'next/link';
import LoadingButton from '@/app/components/buttons/LoadingButton';
import PasswordInput from '@/app/components/form/PasswordInput';
import { PencilIcon } from 'lucide-react';
import { authErrorMessage } from '@/app/auth/errors';
import { defaultSignInValues } from '@/app/(modules)/(auth)/constants';
import { signIn } from 'aws-amplify/auth';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useForm } from 'react-hook-form';
import { useToast } from '@/app/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';

interface IProps {
  /** The account exists but its email isn't confirmed yet. */
  onConfirmSignUp: (credentials: ISignIn) => void;
}

const SignInForm = ({ onConfirmSignUp }: IProps) => {
  const { passwordReset, auth } = useDictionary();
  const { toast } = useToast();
  const [step, setStep] = useState<ESignInSteps>(ESignInSteps.STEP_0);
  const emailRef = useRef<HTMLInputElement>(null);
  const isReturningRef = useRef(false);

  const schema = signinSchema(step);

  const form = useForm<TSignInSchema>({
    resolver: zodResolver(schema),
    defaultValues: defaultSignInValues,
  });

  const email = form.watch('email');
  const isFirstStep = step === ESignInSteps.STEP_0;

  useEffect(() => {
    if (isFirstStep && isReturningRef.current) {
      isReturningRef.current = false;
      emailRef.current?.focus();
      emailRef.current?.select();
    }
  }, [isFirstStep]);

  const handleChangeEmail = () => {
    form.resetField('password');
    isReturningRef.current = true;
    setStep(ESignInSteps.STEP_0);
  };

  async function onSubmit(values: TSignInSchema) {
    if (step === ESignInSteps.STEP_0) {
      setStep(ESignInSteps.STEP_1);
    } else {
      const credentials = values as ISignIn;
      try {
        // On success `AuthGate` moves on to the dashboard.
        const { nextStep } = await signIn({
          username: credentials.email,
          password: credentials.password,
        });
        if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          onConfirmSignUp(credentials);
        } else if (nextStep.signInStep !== 'DONE') {
          toast({ variant: 'error', description: auth.errors.failed });
        }
      } catch (error) {
        toast({ variant: 'error', description: authErrorMessage(error) });
      }
    }
  }

  return (
    <Form {...form}>
      <form
        className="flex w-full flex-col gap-8"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {isFirstStep ? (
          <InputField
            ref={emailRef}
            control={form.control}
            label="Email Address"
            name="email"
            type="email"
            autoComplete="username"
          />
        ) : (
          <>
            <InputField
              control={form.control}
              label="Email Address"
              name="email"
              type="email"
              disabled
              endAdornment={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-full px-3 py-2 hover:bg-transparent"
                  onClick={handleChangeEmail}
                >
                  <PencilIcon className="size-4" aria-hidden="true" />
                  <span className="sr-only">Change email</span>
                </Button>
              }
            />
            <PasswordInput
              control={form.control}
              label="Password"
              name="password"
            />
          </>
        )}

        <Link
          href={
            email
              ? `/forgot-password/?email=${encodeURIComponent(email)}`
              : '/forgot-password/'
          }
          className="self-end text-sm underline"
        >
          {passwordReset.forgotLink}
        </Link>

        <LoadingButton
          variant="default"
          className="w-full"
          type={'submit'}
          loading={form.formState.isSubmitting}
        >
          {isFirstStep ? 'Continue' : 'Sign In'}
        </LoadingButton>
      </form>
    </Form>
  );
};

export default SignInForm;
