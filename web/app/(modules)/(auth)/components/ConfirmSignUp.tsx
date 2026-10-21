'use client';

import {
  TConfirmSignUpSchema,
  createConfirmSignUpSchema,
} from '@/app/(modules)/(auth)/validations';
import { confirmSignUp, resendSignUpCode, signIn } from 'aws-amplify/auth';

import { Button } from '@/app/components/ui/button';
import { Form } from '@/app/components/ui/form';
import { ISignIn } from '@/app/(modules)/(auth)/interfaces';
import InputField from '@/app/components/form/InputField';
import LoadingButton from '@/app/components/buttons/LoadingButton';
import ResendCodeButton from '@/app/auth/ResendCodeButton';
import { authErrorMessage } from '@/app/auth/errors';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import { useToast } from '@/app/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';

interface IProps {
  credentials: ISignIn;
  /** A code is already on its way (sign-up), so resend starts cooled down. */
  codeSent: boolean;
  onBack: () => void;
}

/**
 * Confirms a new account with the mailed code, then signs in with the
 * password just entered (`AuthGate` moves on to the dashboard).
 */
const ConfirmSignUp = ({ credentials, codeSent, onBack }: IProps) => {
  const { emailVerification: text } = useDictionary();
  const { toast } = useToast();
  const { email, password } = credentials;

  const schema = useMemo(
    () => createConfirmSignUpSchema(text.codeRequired),
    [text.codeRequired],
  );

  const form = useForm<TConfirmSignUpSchema>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  async function onSubmit({ code }: TConfirmSignUpSchema) {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      await signIn({ username: email, password });
    } catch (error) {
      toast({ variant: 'error', description: authErrorMessage(error) });
    }
  }

  const resend = async () => {
    try {
      await resendSignUpCode({ username: email });
      toast({
        variant: 'success',
        description: interpolate(text.resent, { email }),
      });
      return true;
    } catch (error) {
      toast({ variant: 'error', description: authErrorMessage(error) });
      return false;
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <h2 className="text-xl font-bold">{text.title}</h2>
      <p>{interpolate(text.intro, { email })}</p>
      <Form {...form}>
        <form
          className="flex w-full flex-col gap-8"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <InputField
            control={form.control}
            label={text.code}
            name="code"
            autoComplete="one-time-code"
            inputMode="numeric"
          />
          <LoadingButton
            className="w-full"
            type="submit"
            loading={form.formState.isSubmitting}
          >
            {text.confirm}
          </LoadingButton>
        </form>
      </Form>
      <ResendCodeButton
        onResend={resend}
        label={text.resend}
        waitLabel={text.resendIn}
        startCooledDown={codeSent}
      />
      <Button type="button" variant="link" onClick={onBack}>
        {text.back}
      </Button>
    </div>
  );
};

export default ConfirmSignUp;
