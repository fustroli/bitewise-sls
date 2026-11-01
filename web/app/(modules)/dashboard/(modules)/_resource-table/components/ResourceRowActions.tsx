'use client';

import { Copy, MoreHorizontal, Pencil, Scale, Trash2 } from 'lucide-react';
import {
  IResourceForm,
  IResourceRecord,
  IResourceRowActionsProps,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/app/components/ui/menubar';

import DeleteDialog from '@/app/components/DeleteDialog';
import { FieldValues } from 'react-hook-form';
import Link from 'next/link';
import { ROW_ACTION_ITEM_CLASS } from '@/app/(modules)/dashboard/(modules)/_resource-table/constants';
import ResourceFormDialog from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceFormDialog';
import { cn } from '@/app/lib/utils';
import { getResourceLabels } from '@/app/(modules)/dashboard/(modules)/_resource-table/helpers';
import { interpolate } from '@/app/utils/helpers';
import { invalidateAll } from '@/app/(modules)/dashboard/(modules)/_resource-table/helpers';
import { toastResult } from '@/app/utils/helpers/client';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface IProps<
  TRecord extends IResourceRecord,
  TValues extends FieldValues,
  TFormData,
> extends IResourceRowActionsProps<TRecord, TFormData> {
  config: IResourceForm<TRecord, TValues, TFormData>;
}

type TRowDialog = 'edit' | 'duplicate' | 'delete';

/** Edit, Duplicate, Compare, then a delete confirmation naming the record. */
function ResourceRowActions<
  TRecord extends IResourceRecord,
  TValues extends FieldValues,
  TFormData,
>({ config, record, formData }: IProps<TRecord, TValues, TFormData>) {
  const dictionary = useDictionary();
  const t = dictionary.resourceTable;
  const labels = getResourceLabels(dictionary, config.resourceKey);

  const queryClient = useQueryClient();
  const compareHref = `/dashboard/compare?type=${config.compareType}&ids=${record.id}`;

  // The dialogs live outside the menu, so picking an item closes the menu
  // without unmounting the dialog it opens. The last one picked stays mounted
  // while closed so its exit animation plays; `openCount` remounts the form
  // dialog on each open, seeding it from the record as it is now.
  const [dialog, setDialog] = useState<TRowDialog | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  const openDialog = (kind: TRowDialog) => {
    setDialog(kind);
    setOpenCount((count) => count + 1);
    setIsOpen(true);
  };

  const handleOnDelete = async () => {
    const result = await config.remove(record.id);
    if (toastResult(result, t.deleted)) {
      invalidateAll(queryClient, config.invalidates);
    }
  };

  return (
    <>
      <Menubar className="ml-auto w-fit border-none bg-transparent p-0 shadow-none">
        <MenubarMenu>
          <MenubarTrigger
            aria-label={interpolate(t.rowActions, { name: record.name })}
            className="size-10 justify-center rounded-md p-0 text-secondary-foreground hover:cursor-pointer hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted data-[state=open]:text-foreground"
          >
            <MoreHorizontal aria-hidden className="size-[18px]" />
          </MenubarTrigger>
          <MenubarContent
            align="end"
            alignOffset={0}
            sideOffset={4}
            className="min-w-40 rounded-lg p-1.5 shadow-lg"
          >
            <MenubarItem
              className={ROW_ACTION_ITEM_CLASS}
              onSelect={() => openDialog('edit')}
            >
              <Pencil />
              {t.edit}
            </MenubarItem>
            <MenubarItem
              className={ROW_ACTION_ITEM_CLASS}
              onSelect={() => openDialog('duplicate')}
            >
              <Copy />
              {t.duplicate}
            </MenubarItem>
            <MenubarItem asChild className={ROW_ACTION_ITEM_CLASS}>
              <Link href={compareHref}>
                <Scale />
                {t.compare}
              </Link>
            </MenubarItem>
            <MenubarSeparator className="mx-0 my-1.5" />
            <MenubarItem
              className={cn(
                ROW_ACTION_ITEM_CLASS,
                'text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive focus-visible:bg-destructive/10 [&_svg]:text-destructive',
              )}
              onSelect={() => openDialog('delete')}
            >
              <Trash2 />
              {t.delete}
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      {dialog === 'delete' ? (
        <DeleteDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          onConfirm={handleOnDelete}
          title={labels.deleteTitle}
          subtitle={interpolate(t.deleteConfirm, { name: record.name })}
          cancelLabel={t.cancel}
          confirmLabel={t.continue}
        />
      ) : (
        dialog && (
          <ResourceFormDialog
            key={openCount}
            config={config}
            record={record}
            formData={formData}
            duplicate={dialog === 'duplicate'}
            open={isOpen}
            onOpenChange={setIsOpen}
          />
        )
      )}
    </>
  );
}

export default ResourceRowActions;
