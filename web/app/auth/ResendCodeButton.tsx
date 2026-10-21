'use client';

import { useEffect, useState } from 'react';

import LoadingButton from '@/app/components/buttons/LoadingButton';
import { interpolate } from '@/app/utils/helpers';

// Seconds the button waits after a send. Cognito's throttle is the real limit;
// this keeps the User from running into it.
export const RESEND_COOLDOWN_SECONDS = 60;
const SECOND_MS = 1000;

const secondsUntil = (deadline: number) =>
  Math.max(0, Math.ceil((deadline - Date.now()) / SECOND_MS));

interface IProps {
  /** Sends a new code; resolves whether to start the cooldown. */
  onResend: () => Promise<boolean>;
  label: string;
  /** With `{seconds}`. */
  waitLabel: string;
  /** Start cooling down, e.g. when a code was just sent. */
  startCooledDown?: boolean;
}

/** Asks for a new code, then waits a minute before it can ask again. */
const ResendCodeButton = ({
  onResend,
  label,
  waitLabel,
  startCooledDown = false,
}: IProps) => {
  const [isSending, setIsSending] = useState(false);
  // A deadline, not a count, so a throttled background tab stays accurate.
  const [cooldownUntil, setCooldownUntil] = useState(() =>
    startCooledDown ? Date.now() + RESEND_COOLDOWN_SECONDS * SECOND_MS : 0,
  );
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!cooldownUntil) return;
    const update = () => setSecondsLeft(secondsUntil(cooldownUntil));
    update();
    const timer = setInterval(update, SECOND_MS);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  const resend = async () => {
    setIsSending(true);
    const coolDown = await onResend();
    setIsSending(false);
    if (coolDown) {
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * SECOND_MS);
    }
  };

  return (
    <LoadingButton
      type="button"
      variant="outline"
      loading={isSending}
      disabled={secondsLeft > 0}
      onClick={resend}
    >
      {secondsLeft > 0
        ? interpolate(waitLabel, { seconds: secondsLeft })
        : label}
    </LoadingButton>
  );
};

export default ResendCodeButton;
