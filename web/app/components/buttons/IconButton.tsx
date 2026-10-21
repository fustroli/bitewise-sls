import { Button, ButtonProps } from '@/app/components/ui/button';

import { forwardRef } from 'react';

/** `aria-label` is required: the button has no visible text. */
type TProps = ButtonProps & Required<Pick<ButtonProps, 'aria-label'>>;

/** A 40px icon-only button. */
const IconButton = forwardRef<HTMLButtonElement, TProps>(
  ({ variant = 'ghost', ...props }, ref) => (
    <Button ref={ref} variant={variant} size="icon" {...props} />
  ),
);
IconButton.displayName = 'IconButton';

export default IconButton;
