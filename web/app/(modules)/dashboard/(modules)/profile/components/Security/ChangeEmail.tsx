'use client';

import {
  TEmailChangeSchema,
  TEmailCodeSchema,
  createEmailChangeSchema,
  createEmailCodeSchema,
} from '@/app/(modules)/dashboard/(modules)/_user/validations';
import {
  confirmUserAttribute,
  sendUserAttributeVerificationCode,
  updateUserAttributes,
} from 'aws-amplify/auth';

import { Button } from '@/app/components/ui/button';
import { Form } from '@/app/components/ui/form';
import InputField from '@/app/components/form/InputField';
import LoadingButton from '@/app/components/buttons/LoadingButton';
import { ME_KEY } from '@/app/(modules)/dashboard/(modules)/_user/queries';
import ResendCodeButton from '@/app/auth/ResendCodeButton';
import SettingsRow from '@/app/(modules)/dashboard/(modules)/profile/components/SettingsRow';
import Typography from '@/app/components/Typography';
import { authErrorMessage } from '@/app/auth/errors';
import { interpolate } from '@/app/utils/helpers';
import { toast } from '@/app/hooks/use-toast';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useForm } from 'react-hook-form';
import { useLocalStorage } from '@/app/hooks/use-local-storage';
import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';
import { zodResolver } from '@hookform/resolvers/zod';

/** Per User: Cognito doesn't tell the app about a change it has pending. */
const pendingEmailKey = (userId: string) =>
  `bitewise:pending-email:v1:${userId}`;

/**
 * Asks Cognito to move sign-in to a new address, which gets a code; the
 * current address stays until the code is entered. No password check (an
 * accepted downgrade, see the handover).
 */
const ChangeEmail = () => {
  const { emailChange: text, validation, profile } = useDictionary();
  const { user } = useUserContext();
  const queryClient = useQueryClient();
  const [pendingEmail, setPendingEmail] = useLocalStorage(
    pendingEmailKey(user.id),
  );

  const requestSchema = useMemo(
    () => createEmailChangeSchema(validation),
    [validation],
  );
  const requestForm = useForm<TEmailChangeSchema>({
    resolver: zodResolver(requestSchema),
    defaultValues: { newEmail: '' },
  });

  const codeSchema = useMemo(
    () => createEmailCodeSchema(text.codeRequired),
    [text.codeRequired],
  );
  const codeForm = useForm<TEmailCodeSchema>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  });

  const showError = (error: unknown) =>
    toast({ variant: 'error', description: authErrorMessage(error) });

  async function onRequest({ newEmail }: TEmailChangeSchema) {
    try {
      await updateUserAttributes({ userAttributes: { email: newEmail } });
      setPendingEmail(newEmail);
      requestForm.reset();
      codeForm.reset();
      toast({
        variant: 'success',
        description: interpolate(text.requested, { email: newEmail }),
      });
    } catch (error) {
      showError(error);
    }
  }

  async function onConfirm({ code }: TEmailCodeSchema) {
    try {
      await confirmUserAttribute({
        userAttributeKey: 'email',
        confirmationCode: code,
      });
      toast({
        variant: 'success',
        description: interpolate(text.confirmed, { email: pendingEmail ?? '' }),
      });
      setPendingEmail(null);
      // The API reads the email from Cognito.
      await queryClient.invalidateQueries({ queryKey: ME_KEY });
    } catch (error) {
      showError(error);
    }
  }

  const resend = async () => {
    try {
      await sendUserAttributeVerificationCode({ userAttributeKey: 'email' });
      toast({
        variant: 'success',
        description: interpolate(text.requested, { email: pendingEmail ?? '' }),
      });
      return true;
    } catch (error) {
      showError(error);
      return false;
    }
  };

  // Forgets the change here; Cognito's pending code just expires unused.
  const cancel = () => {
    setPendingEmail(null);
    toast({ variant: 'success', description: text.cancelled });
  };

  if (user.hasPassword === false) {
    return (
      <SettingsRow
        title={profile.security.emailTitle}
        description={profile.security.emailDescription}
      >
        <div className="space-y-2 rounded-lg border bg-card p-4 md:p-6">
          <Typography variant="p" className="font-medium">
            {user.email}
          </Typography>
          <Typography variant="p">{text.managedByGoogle}</Typography>
        </div>
      </SettingsRow>
    );
  }

  return (
    <SettingsRow
      title={profile.security.emailTitle}
      description={profile.security.emailDescription}
    >
      <div className="space-y-6 rounded-lg border bg-card p-4 md:p-6">
        <Typography variant="p" className="font-medium">
          {interpolate(text.current, { email: user.email })}
        </Typography>

        {pendingEmail ? (
          <div className="flex flex-col gap-6 md:w-1/2">
            <p className="text-sm">
              {interpolate(text.pending, { email: pendingEmail })}
            </p>
            <Form {...codeForm}>
              <form
                className="flex flex-col gap-6"
                onSubmit={codeForm.handleSubmit(onConfirm)}
              >
                <InputField
                  control={codeForm.control}
                  label={text.code}
                  name="code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
                <LoadingButton
                  type="submit"
                  className="w-fit"
                  loading={codeForm.formState.isSubmitting}
                >
                  {text.confirm}
                </LoadingButton>
              </form>
            </Form>
            <div className="flex flex-wrap gap-3">
              <ResendCodeButton
                onResend={resend}
                label={text.resend}
                waitLabel={text.resendIn}
              />
              <Button variant="outline" type="button" onClick={cancel}>
                {text.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <Form {...requestForm}>
            <form
              className="flex flex-col gap-6 md:w-1/2"
              onSubmit={requestForm.handleSubmit(onRequest)}
            >
              <InputField
                control={requestForm.control}
                label={text.newEmail}
                name="newEmail"
                type="email"
              />
              <LoadingButton
                type="submit"
                className="w-fit"
                loading={requestForm.formState.isSubmitting}
              >
                {text.submit}
              </LoadingButton>
            </form>
          </Form>
        )}
      </div>
    </SettingsRow>
  );
};

export default ChangeEmail;
