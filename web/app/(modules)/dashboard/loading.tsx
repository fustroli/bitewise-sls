import { LoaderCircle } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex size-full items-center justify-center">
      <LoaderCircle className="animate-spin" />
    </div>
  );
}
