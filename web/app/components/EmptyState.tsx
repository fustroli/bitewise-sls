import { Inbox, LucideIcon } from 'lucide-react';

import { ReactNode } from 'react';
import { cn } from '@/app/lib';

interface IProps {
  title: string;
  description?: string;
  /** E.g. a button that gets the user out of it. */
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

const EmptyState = ({
  title,
  description,
  action,
  icon = Inbox,
  className,
}: IProps) => {
  const Icon = icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 px-5 py-12 text-center',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon aria-hidden />
      </div>
      <p className="text-base font-bold">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  );
};

export default EmptyState;
