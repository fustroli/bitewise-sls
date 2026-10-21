// Completes a Google sign-in when Cognito redirects back with `?code=`.
import 'aws-amplify/auth/enable-oauth-listener';

import { Amplify } from 'aws-amplify';
import { COGNITO } from '@/app/utils/config';
import { listenForOAuthFailure } from './oauth';

/**
 * Configures Amplify Auth once, in the browser (`instrumentation-client.ts`).
 * Tokens live in localStorage, Amplify's default.
 */
export function configureAmplify() {
  // Both the app domain and localhost are registered on the app client;
  // Cognito checks the one in use.
  const redirect = [`${window.location.origin}/`];

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: COGNITO.userPoolId,
        userPoolClientId: COGNITO.userPoolClientId,
        loginWith: {
          email: true,
          oauth: {
            domain: COGNITO.domain,
            scopes: [
              'openid',
              'email',
              'profile',
              'aws.cognito.signin.user.admin',
            ],
            redirectSignIn: redirect,
            redirectSignOut: redirect,
            responseType: 'code',
          },
        },
      },
    },
  });
  listenForOAuthFailure();
}
