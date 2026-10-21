import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog';

import { ReactNode } from 'react';

interface IProps {
  onConfirm: () => void;
  title: string;
  subtitle: string;
  /** Left out when the dialog is opened from elsewhere via `open`. */
  triggerLabel?: ReactNode;
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  cancelLabel: string;
  confirmLabel: string;
}

const DeleteDialog = (props: IProps) => {
  const {
    onConfirm,
    title,
    subtitle,
    triggerLabel,
    triggerClassName,
    cancelLabel,
    confirmLabel,
    open,
    onOpenChange,
  } = props;
  const handleConfirm = () => onConfirm();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {triggerLabel && (
        <AlertDialogTrigger className={triggerClassName}>
          {triggerLabel}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{subtitle}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDialog;
