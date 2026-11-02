'use client';

import {
  TImageSchema,
  createImageSchema,
} from '@/app/(modules)/dashboard/(modules)/profile/validations/image.validation';
import { useMemo, useState } from 'react';

import { ACCEPTED_IMAGE_TYPES } from '@/app/(modules)/dashboard/(modules)/_user/constants';
import { Button } from '@/app/components/ui/button';
import FileUploadFormField from '@/app/components/form/FileUploadFormField';
import { Form } from '@/app/components/ui/form';
import LoadingButton from '@/app/components/buttons/LoadingButton';
import SettingsRow from '@/app/(modules)/dashboard/(modules)/profile/components/SettingsRow';
import { Upload } from 'lucide-react';
import UserAvatar from '@/app/(modules)/dashboard/(modules)/_user/components/UserAvatar';
import dynamic from 'next/dynamic';
import { toastResult } from '@/app/utils/helpers/client';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useForm } from 'react-hook-form';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';
import { zodResolver } from '@hookform/resolvers/zod';

const loadImageCropDialog = () =>
  import('@/app/components/dialogs/ImageCropDialog');

/** Holds the Crop button's place while react-easy-crop loads. */
const CropButtonFallback = () => {
  const { common } = useDictionary();

  return (
    <Button variant="outline" disabled>
      {common.crop}
    </Button>
  );
};

/** Only needed once an image is picked, so react-easy-crop loads lazily. */
const ImageCropDialog = dynamic(loadImageCropDialog, {
  loading: CropButtonFallback,
});

/**
 * The avatar and sign-in email. The upload goes straight to S3; saving
 * resolves once the re-encoded avatar is live.
 */
const BasicInfo = () => {
  const { common, validation, profile } = useDictionary();
  const { user, uploadAvatar } = useUserContext();

  const [isEditable, setIsEditable] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const imageSchema = useMemo(
    () => createImageSchema(validation),
    [validation],
  );

  const form = useForm<TImageSchema>({
    resolver: zodResolver(imageSchema),
    defaultValues: { file: null },
  });

  async function onSubmit(values: TImageSchema) {
    const result = await uploadAvatar(values.file);
    if (!toastResult(result, common.savedSuccessfully)) return;

    setImagePreviewUrl(null);
    setIsEditable(false);
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    form.setValue('file', selectedFile);
    if (selectedFile) {
      setImagePreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  return (
    <SettingsRow
      title={profile.basic.title}
      description={profile.basic.description}
    >
      <div className="flex flex-wrap items-center gap-5 rounded-lg border bg-card p-4 md:p-6">
        {!isEditable ? (
          <>
            <UserAvatar user={user} className="size-16 rounded-full text-2xl" />
            <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-1">
              <span className="text-[13px] font-bold text-muted-foreground">
                {profile.basic.email}
              </span>
              <span className="break-all text-base font-bold">
                {user.email}
              </span>
            </div>
          </>
        ) : (
          <Form {...form}>
            <form
              className="flex-[1_1_280px]"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="flex flex-wrap items-end gap-4">
                <FileUploadFormField
                  name="file"
                  control={form.control}
                  label={common.profileImage}
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  changeHandler={handleImageChange}
                />
                <LoadingButton
                  type="submit"
                  disabled={!imagePreviewUrl}
                  loading={form.formState.isSubmitting}
                >
                  <Upload /> {common.upload}
                </LoadingButton>
                {imagePreviewUrl && (
                  <ImageCropDialog
                    file={imagePreviewUrl}
                    onSave={(croppedFile) => {
                      form.setValue('file', croppedFile);
                      setImagePreviewUrl(URL.createObjectURL(croppedFile));
                    }}
                  />
                )}
              </div>
            </form>
          </Form>
        )}

        <Button
          variant="outline"
          size="sm"
          className="h-10 px-3.5 text-[13px]"
          type="button"
          onClick={() => {
            // Fetch the cropper while the user picks a file.
            if (!isEditable) void loadImageCropDialog();
            setImagePreviewUrl(null);
            setIsEditable((prev) => !prev);
          }}
          disabled={form.formState.isSubmitting}
        >
          {isEditable ? common.cancel : profile.basic.changePhoto}
        </Button>
      </div>
    </SettingsRow>
  );
};

export default BasicInfo;
