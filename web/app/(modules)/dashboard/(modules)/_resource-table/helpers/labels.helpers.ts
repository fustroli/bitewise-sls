import {
  IResourceLabels,
  TResourceKey,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { TDictionary } from '@/app/providers/dictionary-provider';

export const getResourceLabels = (
  dictionary: TDictionary,
  resourceKey: TResourceKey,
): IResourceLabels => dictionary.resources[resourceKey];
