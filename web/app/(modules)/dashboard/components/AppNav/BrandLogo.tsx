import { Leaf } from 'lucide-react';
import Link from 'next/link';

interface IProps {
  href: string;
  label: string;
}

/** The green leaf square and the wordmark, linking home. */
const BrandLogo = ({ href, label }: IProps) => (
  <Link
    href={href}
    aria-label={label}
    className="flex items-center gap-2.5 rounded-md px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <span className="flex size-8 items-center justify-center rounded-[9px] bg-primary text-primary-foreground">
      <Leaf aria-hidden className="size-[18px]" />
    </span>
    <span className="text-xl font-extrabold tracking-tight">BiteWise</span>
  </Link>
);

export default BrandLogo;
