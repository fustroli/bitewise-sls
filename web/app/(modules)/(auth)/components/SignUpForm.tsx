'use client';

import {
  TSignupSchema,
  createSignupSchema,
} from '@/app/(modules)/(auth)/validations';

import { Form } from '@/app/components/ui/form';
import { ISignIn } from '@/app/(modules)/(auth)/interfaces';
import InputField from '@/app/components/form/InputField';
import LoadingButton from '@/app/components/buttons/LoadingButton';
import PasswordInput from '@/app/components/form/PasswordInput';
import { authErrorMessage } from '@/app/auth/errors';
import { defaultSignUpValues } from '@/app/(modules)/(auth)/constants';
import { signUp } from 'aws-amplify/auth';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import { useToast } from '@/app/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';

interface IProps {
  /** Cognito mailed a code that confirms the new account. */
  onConfirmSignUp: (credentials: ISignIn) => void;
}

const SignUpForm = ({ onConfirmSignUp }: IProps) => {
  const { toast } = useToast();
  const { passwordPolicy } = useDictionary();

  const signupSchema = useMemo(
    () => createSignupSchema(passwordPolicy),
    [passwordPolicy],
  );

  const form = useForm<TSignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: defaultSignUpValues,
  });

  async function onSubmit({ email, password }: TSignupSchema) {
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      });
      onConfirmSignUp({ email, password });
    } catch (error) {
      toast({ variant: 'error', description: authErrorMessage(error) });
    }
  }

  return (
    <Form {...form}>
      <form
        className="flex w-full flex-col gap-8"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <InputField
          control={form.control}
          type={'email'}
          label={'Email Address'}
          name={'email'}
          autoComplete="username"
        />
        <PasswordInput
          control={form.control}
          label="Password"
          name="password"
        />

        <PasswordInput
          control={form.control}
          label="Confirm Password"
          name="confirmPassword"
        />

        <LoadingButton
          variant="default"
          className="w-full"
          type="submit"
          loading={form.formState.isSubmitting}
        >
          Sign Up
        </LoadingButton>
      </form>
    </Form>
  );
};

export default SignUpForm;
