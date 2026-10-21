import { Button } from '@/app/components/ui/button';
import Link from 'next/link';

export interface IMissingInputs {
  message: string;
  linkLabel: string;
  href: string;
}

/** What a card shows until the Profile has what it needs. */
const MissingInputs = ({ message, linkLabel, href }: IMissingInputs) => (
  <div className="flex flex-col items-start gap-4">
    <p className="text-sm text-muted-foreground">{message}</p>
    <Button asChild variant="outline">
      <Link href={href}>{linkLabel}</Link>
    </Button>
  </div>
);

export default MissingInputs;
