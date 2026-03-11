import React from 'react';
import { AuthProvider as AsgardeoAuthProvider } from '@asgardeo/auth-react';
import { MockAuthProvider } from './MockAuthProvider';
import env from '../config/env';

const asgardeoConfig = {
  baseUrl: env.THUNDER_URL,
  clientID: env.THUNDER_CLIENT_ID,
  signInRedirectURL: env.SIGN_IN_REDIRECT_URL,
  signOutRedirectURL: env.SIGN_OUT_REDIRECT_URL,
  scope: env.THUNDER_SCOPES,
  storage: 'localStorage',
  // Thunder's well-known returns issuer "platform-idp" which doesn't match
  // the baseUrl. Cloud Console disables this too (tokenValidation.idToken.validate: false).
  validateIDToken: false,
};

export default function AppAuthProvider({ children }) {
  if (env.DEV_BYPASS_AUTH) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  return (
    <AsgardeoAuthProvider config={asgardeoConfig}>
      {children}
    </AsgardeoAuthProvider>
  );
}
