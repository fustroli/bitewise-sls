'use client';

import {
  IResourceList,
  IResourceRecord,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { Plus, Scale } from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { noFormDataQuery } from '@/app/(modules)/dashboard/(modules)/_resource-table/helpers';
import { useQuery } from '@tanstack/react-query';

interface IProps<TRecord extends IResourceRecord, TFormData> {
  resource: IResourceList<TRecord, TFormData>;
  compareLabel: string;
  addLabel: string;
  /** `icon`: the phone app bar's icon buttons. */
  variant: 'buttons' | 'icon';
}

/** "Compare …" and "Add …"; Add stays disabled until its form data is in. */
function ResourceHeaderActions<TRecord extends IResourceRecord, TFormData>({
  resource,
  compareLabel,
  addLabel,
  variant,
}: IProps<TRecord, TFormData>) {
  const compareHref = `/dashboard/compare?type=${resource.compareType}`;
  const isIcon = variant === 'icon';
  const { data: formData, isSuccess } = useQuery(
    resource.formDataQuery ?? noFormDataQuery<TFormData>(),
  );
  const Dialog = resource.dialog;

  return (
    <>
      {isIcon ? (
        <Button asChild variant="ghost" size="icon" className="size-11">
          <Link href={compareHref} aria-label={compareLabel}>
            <Scale aria-hidden className="!size-5" />
          </Link>
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link href={compareHref}>
            <Scale aria-hidden />
            {compareLabel}
          </Link>
        </Button>
      )}
      {isSuccess ? (
        <Dialog
          formData={formData as TFormData}
          trigger={isIcon ? 'icon' : 'button'}
        />
      ) : isIcon ? (
        <Button size="icon" className="size-11" disabled aria-label={addLabel}>
          <Plus aria-hidden className="!size-5" />
        </Button>
      ) : (
        <Button disabled>
          <Plus aria-hidden />
          {addLabel}
        </Button>
      )}
    </>
  );
}

export default ResourceHeaderActions;
