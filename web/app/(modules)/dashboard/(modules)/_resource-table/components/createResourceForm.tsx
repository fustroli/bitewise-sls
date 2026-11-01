import {
  IResourceDialogProps,
  IResourceForm,
  IResourceRecord,
  IResourceRowActionsProps,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { FieldValues } from 'react-hook-form';
import ResourceFormDialog from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceFormDialog';
import ResourceRowActions from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceRowActions';

/** Binds a resource's form to the module's dialog and row-actions menu. */
export function createResourceForm<
  TRecord extends IResourceRecord,
  TValues extends FieldValues,
  TFormData = undefined,
>(config: IResourceForm<TRecord, TValues, TFormData>) {
  const Dialog = (props: IResourceDialogProps<TRecord, TFormData>) => (
    <ResourceFormDialog config={config} {...props} />
  );

  const RowActions = (props: IResourceRowActionsProps<TRecord, TFormData>) => (
    <ResourceRowActions config={config} {...props} />
  );

  return { Dialog, RowActions };
}
