import { ReactNode } from 'react';
import { cn } from '@/app/lib';

interface IProps {
  children: ReactNode;
  className?: string;
}

/** A small accent pill, e.g. a BMI category. */
const Chip = ({ children, className }: IProps) => (
  <span
    className={cn(
      'inline-flex items-center whitespace-nowrap rounded-full bg-accent px-2.5 py-1 text-xs font-extrabold text-accent-foreground',
      className,
    )}
  >
    {children}
  </span>
);

export default Chip;
