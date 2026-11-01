import { DefaultValues, FieldValues, UseFormReturn } from 'react-hook-form';
import { ComponentType } from 'react';
import { QueryKey } from '@tanstack/react-query';
import { TApiResult } from '@/app/utils/interfaces';
import { TDictionary } from '@/app/providers/dictionary-provider';
import { z } from 'zod';

export type TResourceKey = keyof TDictionary['resources'];

/** What every table row needs: an id to act on and a name to confirm with. */
export interface IResourceRecord {
  id: string;
  name: string;
}

export interface IResourceFieldsProps<TValues extends FieldValues, TFormData> {
  form: UseFormReturn<TValues>;
  formData: TFormData;
}

/** The client half of a resource: everything its add/edit dialog needs. */
export interface IResourceForm<
  TRecord extends IResourceRecord,
  TValues extends FieldValues,
  TFormData = undefined,
> {
  resourceKey: TResourceKey;
  /** Built from the dictionary so validation messages are translated. */
  schema: (dictionary: TDictionary) => z.ZodType<TValues, any>;
  defaultValues: DefaultValues<TValues>;
  toFormValues: (record: TRecord) => DefaultValues<TValues>;
  fields: ComponentType<IResourceFieldsProps<TValues, TFormData>>;
  create: (values: TValues) => Promise<TApiResult<unknown>>;
  update: (values: TValues, id: string) => Promise<TApiResult<unknown>>;
  remove: (id: string) => Promise<TApiResult<unknown>>;
  /**
   * Queries a successful write makes stale: the resource's own, the
   * resources whose values include it, and the library counts.
   */
  invalidates: QueryKey[];
  /** The Compare page's `type`: the menu links there with the record. */
  compareType: string;
}

/**
 * How a dialog's trigger looks: a primary button (Add), a 44px icon button
 * (Add, phone app bar) or an outline button (Edit, phone rows). Defaults:
 * `button` for Add, `outline` with a record.
 */
export type TResourceDialogTrigger = 'button' | 'icon' | 'outline';

export interface IResourceDialogProps<TRecord, TFormData> {
  record?: TRecord;
  /** With a `record`: Add dialog prefilled from it instead of Edit. */
  duplicate?: boolean;
  formData: TFormData;
  trigger?: TResourceDialogTrigger;
  /** Opened from elsewhere (a menu item): no trigger is rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface IResourceRowActionsProps<TRecord, TFormData> {
  record: TRecord;
  formData: TFormData;
}
