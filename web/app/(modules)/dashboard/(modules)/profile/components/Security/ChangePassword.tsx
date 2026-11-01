'use client';

import {
  TChangePasswordSchema,
  createChangePasswordSchema,
} from '@/app/(modules)/dashboard/(modules)/profile/validations';

import { CHANGE_PASSWORD_DEFAULT_VALUES } from '@/app/(modules)/dashboard/(modules)/profile/constants';
import { Form } from '@/app/components/ui/form';
import LoadingButton from '@/app/components/buttons/LoadingButton';
import { PASSWORD_RULE_KEYS } from '@/app/utils/password-policy';
import PasswordInput from '@/app/components/form/PasswordInput';
import SettingsRow from '@/app/(modules)/dashboard/(modules)/profile/components/SettingsRow';
import { authErrorMessage } from '@/app/auth/errors';
import { toast } from '@/app/hooks/use-toast';
import { updatePassword } from 'aws-amplify/auth';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

const ChangePassword = () => {
  const { profile, passwordPolicy } = useDictionary();

  const changePasswordSchema = useMemo(
    () => createChangePasswordSchema(passwordPolicy),
    [passwordPolicy],
  );

  const form = useForm<TChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: CHANGE_PASSWORD_DEFAULT_VALUES,
  });

  // Other devices stay signed in (no session management, see the handover).
  async function onSubmit({ oldPassword, password }: TChangePasswordSchema) {
    try {
      await updatePassword({ oldPassword, newPassword: password });
      toast({
        variant: 'success',
        description: profile.security.passwordChanged,
      });
      form.reset();
    } catch (error) {
      toast({
        variant: 'error',
        description: authErrorMessage(error, {
          NotAuthorizedException: profile.security.wrongPassword,
        }),
      });
    }
  }
  return (
    <SettingsRow
      title={profile.security.passwordTitle}
      description={profile.security.passwordDescription}
    >
      <div className="rounded-lg border bg-card p-4 md:p-6">
        <Form {...form}>
          <form
            className="flex flex-col gap-6 lg:flex-row lg:gap-8"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <article className="flex flex-1 flex-col gap-5">
              <PasswordInput
                control={form.control}
                label={profile.security.oldPassword}
                name="oldPassword"
              />
              <PasswordInput
                control={form.control}
                label={profile.security.password}
                name="password"
              />

              <PasswordInput
                control={form.control}
                label={profile.security.confirmPassword}
                name="confirmPassword"
              />
            </article>

            <article className="flex flex-1 flex-col justify-between gap-6">
              <ul className="list-disc space-y-2 pl-5 text-sm text-secondary-foreground">
                {PASSWORD_RULE_KEYS.map((key) => (
                  <li key={key}>{passwordPolicy[key]}</li>
                ))}
              </ul>

              <LoadingButton
                variant="default"
                type="submit"
                className="self-end"
                loading={form.formState.isSubmitting}
              >
                {profile.security.changePassword}
              </LoadingButton>
            </article>
          </form>
        </Form>
      </div>
    </SettingsRow>
  );
};

export default ChangePassword;
