// Build-time values (inlined by Next).
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const COGNITO = {
  userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID ?? '',
  userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ?? '',
  // Hosted domain without `https://`, for the Google redirect.
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? '',
};
