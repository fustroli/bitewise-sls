import { ReactNode } from 'react';

interface IProps {
  title: string;
  description?: string;
  /** On the right, e.g. the value or a control. */
  aside?: ReactNode;
}

/** A dashboard card's h3 and subtitle. */
const CardHeading = ({ title, description, aside }: IProps) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="flex flex-col gap-0.5">
      <h3 className="text-[15px] font-extrabold md:text-base">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground md:text-[13px]">
          {description}
        </p>
      )}
    </div>
    {aside}
  </div>
);

export default CardHeading;
