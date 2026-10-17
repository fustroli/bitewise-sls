import { Logger } from '@aws-lambda-powertools/logger';
import type { CustomMessageTriggerEvent, CustomMessageTriggerHandler } from 'aws-lambda';
import { type LayoutInput, renderLayout } from '../lib/email-layout';
import { requireEnv } from '../lib/env';

const logger = new Logger({ serviceName: 'custom-message' });
const APP_URL = requireEnv('APP_URL');

type Template = Omit<LayoutInput, 'code'>;

const VERIFY_EMAIL: Template = {
  subject: 'Verify your BiteWise email',
  preheader: 'Confirm your email address to finish setting up BiteWise.',
  heading: 'Confirm your email',
  paragraphs: ['Welcome to BiteWise! Enter this code to confirm this is your email address.'],
  codeNote: 'The code expires in 24 hours.',
  reason:
    "You're receiving this because this address was used to sign up for BiteWise. If that wasn't you, you can ignore this email.",
};

const PASSWORD_RESET: Template = {
  subject: 'Reset your BiteWise password',
  preheader: 'Choose a new password for your BiteWise account.',
  heading: 'Reset your password',
  paragraphs: ['Someone asked to reset the password for your BiteWise account. Enter this code to choose a new one.'],
  codeNote: 'The code expires in 1 hour. Resetting signs you out on every device.',
  reason:
    "You're receiving this because a password reset was requested for this address. If you didn't ask for it, you can ignore this email; your password stays the same.",
};

// Mailed to the new address of an Email change
const EMAIL_CHANGE: Template = {
  subject: 'Confirm your new BiteWise email',
  preheader: 'Confirm this address to make it your BiteWise sign-in email.',
  heading: 'Confirm your new email',
  paragraphs: ['Someone asked to make this the sign-in email of their BiteWise account. Enter this code to confirm it.'],
  codeNote: 'The code expires in 24 hours. Until then, the account keeps signing in with its current email.',
  reason:
    "You're receiving this because this address was entered as the new email of a BiteWise account. If that wasn't you, you can ignore this email.",
};

const TEMPLATES: Partial<Record<CustomMessageTriggerEvent['triggerSource'], Template>> = {
  CustomMessage_SignUp: VERIFY_EMAIL,
  CustomMessage_ResendCode: VERIFY_EMAIL,
  CustomMessage_ForgotPassword: PASSWORD_RESET,
  CustomMessage_UpdateUserAttribute: EMAIL_CHANGE,
  CustomMessage_VerifyUserAttribute: EMAIL_CHANGE,
};

/** Replaces Cognito's plain code emails with the branded layout. Other messages keep Cognito's default. */
export const handler: CustomMessageTriggerHandler = async (event) => {
  const template = TEMPLATES[event.triggerSource];
  if (!template) {
    logger.info('No template, using the Cognito default', { triggerSource: event.triggerSource });
    return event;
  }

  event.response.emailSubject = template.subject;
  event.response.emailMessage = renderLayout({ ...template, code: event.request.codeParameter }, APP_URL);
  return event;
};
