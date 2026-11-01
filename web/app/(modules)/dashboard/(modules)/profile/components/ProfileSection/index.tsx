'use client';

import { DefaultValues, FieldValues, useForm } from 'react-hook-form';
import {
  IUser,
  IUserChange,
} from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import {
  ProfileFieldInput,
  ProfileFieldValue,
  ProfileSwitchField,
} from '@/app/(modules)/dashboard/(modules)/profile/components/ProfileSection/ProfileField';
import { ReactNode, useMemo, useState } from 'react';
import {
  TDictionary,
  useDictionary,
} from '@/app/providers/dictionary-provider';

import { Button } from '@/app/components/ui/button';
import { Form } from '@/app/components/ui/form';
import LoadingButton from '@/app/components/buttons/LoadingButton';
import SettingsRow from '@/app/(modules)/dashboard/(modules)/profile/components/SettingsRow';
import { TProfileField } from '@/app/(modules)/dashboard/(modules)/profile/interfaces';
import { cn } from '@/app/lib';
import { toastResult } from '@/app/utils/helpers/client';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface IProps<TValues extends FieldValues> {
  /** The section's anchor, for links to this section. */
  id?: string;
  title: string;
  description?: string;
  /** Under the description, e.g. a link. */
  aside?: ReactNode;
  /** The Edit button's text; defaults to `common.edit`. */
  editLabel?: string;
  /** Pass a stable (module-level) function; it runs once per dictionary. */
  createSchema: (dictionary: TDictionary) => z.ZodType<TValues, TValues>;
  toFormValues: (user: IUser) => TValues;
  /** `user` is the User as saved, before this change. */
  toChange: (values: TValues, user: IUser) => IUserChange;
  fields: TProfileField<TValues>[];
  /** Defaults to `common.savedSuccessfully`. */
  successMessage?: string;
  /** No Edit/Cancel: the fields are always editable and Save is always shown. */
  alwaysEditing?: boolean;
}

/** Consecutive fields of the same `group`, in order. */
const groupFields = <TValues extends FieldValues>(
  fields: TProfileField<TValues>[],
) =>
  fields.reduce<{ title?: string; fields: TProfileField<TValues>[] }[]>(
    (groups, field) => {
      const last = groups.at(-1);
      if (last && last.title === field.group) last.fields.push(field);
      else groups.push({ title: field.group, fields: [field] });
      return groups;
    },
    [],
  );

/**
 * A settings row that shows part of the User's Profile and runs its edit →
 * save cycle: Cancel restores the User's values, a failed save stays in edit
 * mode, a successful one updates the User and leaves edit mode.
 */
const ProfileSection = <TValues extends FieldValues>({
  id,
  title,
  description,
  aside,
  editLabel,
  createSchema,
  toFormValues,
  toChange,
  fields,
  successMessage,
  alwaysEditing = false,
}: IProps<TValues>) => {
  const dictionary = useDictionary();
  const { common } = dictionary;
  const { user, updateUser } = useUserContext();
  const [isEditing, setIsEditing] = useState(alwaysEditing);

  const schema = useMemo(
    () => createSchema(dictionary),
    [createSchema, dictionary],
  );

  const savedValues = toFormValues(user);

  const form = useForm<TValues>({
    resolver: zodResolver(schema),
    defaultValues: savedValues as DefaultValues<TValues>,
  });

  const startEditing = () => {
    form.reset(savedValues);
    setIsEditing(true);
  };

  const cancel = () => {
    form.reset(savedValues);
    setIsEditing(false);
  };

  async function onSubmit(values: TValues) {
    const result = await updateUser(toChange(values, user));

    if (!toastResult(result, successMessage ?? common.savedSuccessfully)) {
      return;
    }

    form.reset(toFormValues(result.data));
    if (!alwaysEditing) setIsEditing(false);
  }

  const renderRead = () =>
    groupFields(fields).map((group, index) => (
      <div key={group.title ?? index} className={cn(index > 0 && 'border-t')}>
        {group.title && (
          <p className="px-4 pb-1 pt-3.5 text-xs font-extrabold uppercase tracking-wider text-primary md:px-6">
            {group.title}
          </p>
        )}
        <dl className="md:grid md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          {group.fields.map((field) =>
            field.kind === 'switch' ? (
              <ProfileSwitchField
                key={field.name}
                field={field}
                form={form}
                isEditing={false}
              />
            ) : (
              <ProfileFieldValue
                key={field.name}
                field={field}
                value={savedValues[field.name]}
                notSet={common.notSet}
              />
            ),
          )}
        </dl>
      </div>
    ));

  const renderEdit = () => (
    <div className="grid gap-x-6 gap-y-5 p-4 md:grid-cols-2 md:p-6">
      {fields.map((field) =>
        field.kind === 'switch' ? (
          <ProfileSwitchField
            key={field.name}
            field={field}
            form={form}
            isEditing
          />
        ) : (
          <ProfileFieldInput key={field.name} field={field} form={form} />
        ),
      )}
    </div>
  );

  return (
    <SettingsRow id={id} title={title} description={description} aside={aside}>
      <div className="overflow-hidden rounded-lg border bg-card">
        <Form {...form}>
          {/* The schema validates, with the dictionary's messages. */}
          <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
            {isEditing ? renderEdit() : renderRead()}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-surface-subtle px-4 py-3 md:px-6">
              {isEditing ? (
                <>
                  {!alwaysEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-3.5 text-[13px]"
                      type="button"
                      onClick={cancel}
                      disabled={form.formState.isSubmitting}
                    >
                      {common.cancel}
                    </Button>
                  )}
                  <LoadingButton
                    type="submit"
                    size="sm"
                    className="h-10 px-3.5 text-[13px]"
                    loading={form.formState.isSubmitting}
                  >
                    {common.save}
                  </LoadingButton>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-3.5 text-[13px]"
                  type="button"
                  onClick={startEditing}
                >
                  {editLabel ?? common.edit}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </SettingsRow>
  );
};

export default ProfileSection;
