'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { ReactNode, useMemo } from 'react';
import {
  TLoadMealPlanSchema,
  createLoadMealPlanSchema,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import { convertToOptions, interpolate } from '@/app/utils/helpers';

import { Button } from '@/app/components/ui/button';
import ComboboxField from '@/app/components/form/ComboboxField';
import { Form } from '@/app/components/ui/form';
import FormDialogFooter from '@/app/components/dialogs/FormDialogFooter';
import { IMealPlanOption } from '@/app/(modules)/dashboard/(modules)/meal-plans/interfaces';
import Link from 'next/link';
import { mealPlanOptionsQuery } from '@/app/(modules)/dashboard/(modules)/meal-plans/queries';
import { toast } from '@/app/hooks/use-toast';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';

interface IProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Picked when the dialog opens, e.g. from a Meal plan's "Open as draft". */
  initialMealPlanId?: string;
  /** Replaces the draft's description, saying where the copy goes. */
  description?: string;
  /** Below the Meal plan picker: what else the load needs, what it replaces. */
  children?: ReactNode;
  submitLabel?: string;
  submitDisabled?: boolean;
  mealPlansHref: string;
  onLoad: (mealPlan: IMealPlanOption) => void;
}

/** `undefined` while loading, `null` when the fetch failed. */
type TMealPlans = IMealPlanOption[] | null | undefined;

/**
 * Picks one of the User's Meal plans to copy from; the caller puts the copy
 * where it goes. Nothing is saved on the backend.
 */
const LoadMealPlanDialog = ({
  open,
  onOpenChange,
  initialMealPlanId,
  description,
  children,
  submitLabel,
  submitDisabled,
  mealPlansHref,
  onLoad,
}: IProps) => {
  const dictionary = useDictionary();
  const { draftMealPlan, resourceTable } = dictionary;
  const labels = draftMealPlan.load;

  // Mounted afresh for every opening (see the provider): fresh plans each time.
  const query = useQuery({
    ...mealPlanOptionsQuery,
    enabled: open,
    refetchOnMount: 'always',
  });
  const mealPlans: TMealPlans =
    query.isError && !query.isFetching ? null : query.data;

  const schema = useMemo(
    () => createLoadMealPlanSchema(dictionary),
    [dictionary],
  );
  const form = useForm<TLoadMealPlanSchema>({
    resolver: zodResolver(schema),
    defaultValues: { mealPlanId: initialMealPlanId ?? '' },
  });

  const retry = () => void query.refetch();

  const onSubmit = ({ mealPlanId }: TLoadMealPlanSchema) => {
    const mealPlan = mealPlans?.find(({ id }) => id === mealPlanId);
    if (!mealPlan) return;

    onLoad(mealPlan);
    onOpenChange(false);
    toast({
      variant: 'success',
      description: interpolate(labels.loaded, { name: mealPlan.name }),
    });
  };

  const renderBody = () => {
    if (mealPlans === undefined) {
      return <p className="py-4 text-muted-foreground">{labels.loading}</p>;
    }

    if (mealPlans === null) {
      return (
        <div className="flex flex-col items-start gap-3 py-4">
          <p className="text-destructive">{labels.error}</p>
          <Button type="button" variant="outline" onClick={() => void retry()}>
            {labels.retry}
          </Button>
        </div>
      );
    }

    if (!mealPlans.length) {
      return (
        <div className="flex flex-col items-start gap-3 py-4">
          <p className="text-muted-foreground">{labels.empty}</p>
          <Button asChild variant="outline">
            <Link href={mealPlansHref}>{labels.goToMealPlans}</Link>
          </Button>
        </div>
      );
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <ComboboxField
            control={form.control}
            name="mealPlanId"
            label={labels.mealPlan}
            options={convertToOptions(mealPlans)}
            placeholder={labels.placeholder}
            searchPlaceholder={resourceTable.search}
            emptyText={resourceTable.notFound}
            className="w-full"
          />
          {children}
          <FormDialogFooter
            form={form}
            onClose={() => onOpenChange(false)}
            submitLabel={submitLabel ?? labels.submit}
            submitDisabled={submitDisabled}
            closeLabel={resourceTable.cancel}
          />
        </form>
      </Form>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>
            {description ?? labels.description}
          </DialogDescription>
        </DialogHeader>
        {renderBody()}
      </DialogContent>
    </Dialog>
  );
};

export default LoadMealPlanDialog;
