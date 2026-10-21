import { ReactNode } from 'react';

interface IProps {
  title: string;
  description?: string;
  /** Buttons on the right; they wrap under the title on small screens. */
  actions?: ReactNode;
  /**
   * Phone width: a 60px app bar with the title and these (icon) actions
   * replaces the desktop header. Leave out to show `actions` there too;
   * `null` for none.
   */
  mobileActions?: ReactNode;
  /** Phone width: shown before the title, e.g. a back link. */
  mobileLeading?: ReactNode;
  /** Phone width: a shorter title, e.g. "Account" for "Account settings". */
  mobileTitle?: string;
}

/**
 * A page's h1, its one-line description and its main actions. At phone width
 * it becomes the sticky app bar at the top of the screen; only one of the two
 * is displayed, so there is one h1.
 */
const PageHeader = ({
  title,
  description,
  actions,
  mobileActions,
  mobileLeading,
  mobileTitle,
}: IProps) => (
  <>
    <div className="sticky top-0 z-30 order-first -mx-4 -mt-4 flex h-[60px] items-center justify-between gap-2 border-b bg-card pl-4 pr-2 md:hidden">
      <div className="flex min-w-0 items-center gap-1">
        {mobileLeading}
        <h1 className="truncate text-xl font-extrabold tracking-tight">
          {mobileTitle ?? title}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {mobileActions === undefined ? actions : mobileActions}
      </div>
    </div>
    <header className="order-first hidden flex-wrap items-end justify-between gap-4 md:flex">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-extrabold leading-tight tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[15px] text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </header>
  </>
);

export default PageHeader;
