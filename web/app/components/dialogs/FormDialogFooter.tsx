import { DialogClose, DialogFooter } from '@/app/components/ui/dialog';

import { Button } from '@/app/components/ui/button';
import LoadingButton from '@/app/components/buttons/LoadingButton';
import { UseFormReturn } from 'react-hook-form';

interface IProps {
  form: UseFormReturn<any>;
  onClose: () => void;
  submitLabel: string;
  closeLabel: string;
  /** Blocks submitting, e.g. while a choice outside the form is missing. */
  submitDisabled?: boolean;
}
const FormDialogFooter = ({
  form,
  onClose,
  submitLabel,
  closeLabel,
  submitDisabled,
}: IProps) => {
  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button type="button" variant="secondary" onClick={onClose}>
          {closeLabel}
        </Button>
      </DialogClose>

      <LoadingButton
        loading={form.formState.isSubmitting}
        type="submit"
        variant="default"
        disabled={submitDisabled}
      >
        {submitLabel}
      </LoadingButton>
    </DialogFooter>
  );
};

export default FormDialogFooter;
