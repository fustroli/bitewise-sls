'use client';

import {
  DefaultValues,
  FieldValues,
  Path,
  Resolver,
  useForm,
} from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import {
  IResourceDialogProps,
  IResourceForm,
  IResourceRecord,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { useMemo, useState } from 'react';

import { Button } from '@/app/components/ui/button';
import { Form } from '@/app/components/ui/form';
import FormDialogFooter from '@/app/components/dialogs/FormDialogFooter';
import { Plus } from 'lucide-react';
import { getResourceLabels } from '@/app/(modules)/dashboard/(modules)/_resource-table/helpers';
import { interpolate } from '@/app/utils/helpers';
import { invalidateAll } from '@/app/(modules)/dashboard/(modules)/_resource-table/helpers';
import { toastResult } from '@/app/utils/helpers/client';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';

/** The backend's answer to a name another of the user's items already has. */
const NAME_TAKEN_STATUS = 409;

interface IProps<
  TRecord extends IResourceRecord,
  TValues extends FieldValues,
  TFormData,
> extends IResourceDialogProps<TRecord, TFormData> {
  config: IResourceForm<TRecord, TValues, TFormData>;
}

/**
 * Add dialog without a `record`, Edit dialog with one. With `duplicate` the
 * record only seeds an Add dialog, its name prefixed "Copy of". Closes on success
 * (resetting the Add form); stays open on failure so the input isn't lost.
 * A name already in use shows on the name field instead of a toast. With
 * `open` it's controlled and renders no trigger; the opener remounts it (via
 * `key`) so Edit and Duplicate start from the record as it is now.
 */
function ResourceFormDialog<
  TRecord extends IResourceRecord,
  TValues extends FieldValues,
  TFormData,
>({
  config,
  record,
  duplicate,
  formData,
  trigger,
  open,
  onOpenChange,
}: IProps<TRecord, TValues, TFormData>) {
  const { fields: Fields } = config;
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const t = dictionary.resourceTable;
  const labels = getResourceLabels(dictionary, config.resourceKey);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;
  const setIsOpen = onOpenChange ?? setUncontrolledOpen;

  const schema = useMemo(() => config.schema(dictionary), [config, dictionary]);

  const isEdit = !!record && !duplicate;

  const seedValues = () => {
    if (!record) return config.defaultValues;
    const values = config.toFormValues(record);
    if (!duplicate) return values;
    return {
      ...values,
      name: interpolate(t.copyOf, { name: record.name }),
    } as DefaultValues<TValues>;
  };

  const form = useForm<TValues>({
    resolver: zodResolver(schema) as Resolver<TValues>,
    defaultValues: seedValues(),
  });

  const handleOpenChange = (open: boolean) => {
    // Edit and Duplicate always start from the record as it is now.
    if (open && record) form.reset(seedValues());
    setIsOpen(open);
  };

  const onSubmit = async (values: TValues) => {
    const result =
      isEdit && record
        ? await config.update(values, record.id)
        : await config.create(values);

    if (!result.ok && result.status === NAME_TAKEN_STATUS) {
      // Every resource has a name; show the clash on that field.
      form.setError('name' as Path<TValues>, { message: t.nameTaken });
      return;
    }

    if (toastResult(result, isEdit ? t.updated : t.created)) {
      invalidateAll(queryClient, config.invalidates);
      if (!isEdit) form.reset(seedValues());
      setIsOpen(false);
    }
  };

  const triggerKind = trigger ?? (record ? 'outline' : 'button');
  const triggerText = isEdit
    ? t.edit
    : duplicate
      ? t.duplicate
      : labels.addTitle;

  const renderTrigger = () => {
    if (isControlled) return null;
    if (triggerKind === 'icon') {
      return (
        <DialogTrigger asChild>
          <Button size="icon" className="size-11" aria-label={triggerText}>
            <Plus aria-hidden className="!size-5" />
          </Button>
        </DialogTrigger>
      );
    }
    return (
      <DialogTrigger asChild>
        <Button variant={triggerKind === 'outline' ? 'outline' : 'default'}>
          {triggerKind === 'button' && <Plus aria-hidden />}
          {triggerText}
        </Button>
      </DialogTrigger>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {renderTrigger()}
      <DialogContent>
        <Form {...form}>
          <form
            className="flex flex-col gap-2 px-4 pb-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <DialogHeader>
              <DialogTitle>
                {isEdit ? labels.editTitle : labels.addTitle}
              </DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <Fields form={form} formData={formData} />
            <FormDialogFooter
              form={form}
              submitLabel={isEdit ? t.save : t.add}
              closeLabel={t.close}
              onClose={() => setIsOpen(false)}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default ResourceFormDialog;
