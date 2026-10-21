import { LucideIcon } from 'lucide-react';
import { TDictionary } from '@/app/providers/dictionary-provider';

type TNavLabel = keyof TDictionary['dashboard']['sidebar'];

export interface INavItem {
  /** The sidebar's label. */
  label: TNavLabel;
  /** The shorter label of the phone tab bar. */
  mobileLabel: TNavLabel;
  /** Under `/dashboard`; `''` is the dashboard itself. */
  route: string;
  icon: LucideIcon;
  /** Phone width: other routes its tab stays active on. */
  phoneRoutes?: string[];
}
