import { ReactNode } from 'react';
import { cn } from '@/app/lib';

interface IProps {
  /** Labels the section; also its anchor. */
  id: string;
  title: string;
  description?: string;
  /** Next to the heading, e.g. a filter. */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** A titled block of a page: heading, one-line description, then content. */
const Section = ({
  id,
  title,
  description,
  actions,
  className,
  children,
}: IProps) => (
  <section
    id={id}
    aria-labelledby={`${id}-heading`}
    className={cn('flex scroll-mt-20 flex-col gap-4', className)}
  >
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h2
          id={`${id}-heading`}
          className="text-[17px] font-extrabold md:text-lg"
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions}
    </div>
    {children}
  </section>
);

export default Section;
