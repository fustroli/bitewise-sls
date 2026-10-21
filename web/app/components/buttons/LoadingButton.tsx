import { Button, ButtonProps } from '@/app/components/ui/button';

import { LoaderCircle } from 'lucide-react';
import { PropsWithChildren } from 'react';
import { cn } from '@/app/lib';

interface IProps extends ButtonProps, PropsWithChildren {
  className?: string;
  loading?: boolean;
}
const LoadingButton = (props: IProps) => {
  const { className, loading, children, ...rest } = props;
  return (
    <Button
      {...rest}
      className={cn('', className, loading && 'pointer-events-none')}
      disabled={loading || rest.disabled}
    >
      {loading ? <LoaderCircle className="animate-spin" /> : <>{children}</>}
    </Button>
  );
};

export default LoadingButton;
