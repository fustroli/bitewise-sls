import { ReactNode } from 'react';
import { cn } from '@/app/lib';

interface IProps {
  /** The section's anchor, for links to it. */
  id?: string;
  title: string;
  description?: string;
  /** Under the description, e.g. a link. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * One settings group: its title and description on the left, its card on
 * the right (stacked on a phone). Rows after the first get a divider.
 */
const SettingsRow = ({
  id,
  title,
  description,
  aside,
  children,
  className,
}: IProps) => {
  const headingId = `${id ?? title.replace(/\W+/g, '-').toLowerCase()}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        'flex scroll-mt-20 flex-wrap gap-4 border-t pt-8 first:border-t-0 first:pt-0 md:gap-6 md:pt-10',
        className,
      )}
    >
      <div className="flex flex-[1_1_240px] flex-col gap-1.5">
        <h2 id={headingId} className="text-[17px] font-extrabold">
          {title}
        </h2>
        {description && (
          <p className="text-sm leading-normal text-muted-foreground">
            {description}
          </p>
        )}
        {aside}
      </div>
      <div className="min-w-0 flex-[3_1_480px]">{children}</div>
    </section>
  );
};

export default SettingsRow;
