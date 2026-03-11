import React, { useEffect, useRef, useState } from 'react';
import useAuth from './useAuth';

const CALLBACK_KEY = 'cptest_auth_callback_pending';
const CALLBACK_TIMEOUT_MS = 10000;

export default function AuthGuard({ children }) {
  const { state, signIn } = useAuth();
  const signInTriggered = useRef(false);

  // Detect if we landed with an OAuth callback (code + state in URL).
  // The SDK will consume these and clear the URL via history.pushState,
  // but isAuthenticated remains false during the token exchange window.
  // We persist this flag in sessionStorage so it survives URL cleanup
  // and StrictMode re-mounts.
  const [callbackPending, setCallbackPending] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('code') && params.has('state')) {
      sessionStorage.setItem(CALLBACK_KEY, Date.now().toString());
      return true;
    }
    const ts = sessionStorage.getItem(CALLBACK_KEY);
    if (ts && Date.now() - parseInt(ts, 10) < CALLBACK_TIMEOUT_MS) {
      return true;
    }
    sessionStorage.removeItem(CALLBACK_KEY);
    return false;
  });

  // Clear the pending flag once authentication completes
  useEffect(() => {
    if (state.isAuthenticated && callbackPending) {
      sessionStorage.removeItem(CALLBACK_KEY);
      setCallbackPending(false);
    }
  }, [state.isAuthenticated, callbackPending]);

  // Timeout: if callback processing takes too long, clear the flag
  // so the user isn't stuck on "Authenticating..." forever
  useEffect(() => {
    if (!callbackPending) return;
    const timer = setTimeout(() => {
      sessionStorage.removeItem(CALLBACK_KEY);
      setCallbackPending(false);
    }, CALLBACK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [callbackPending]);

  // Only trigger signIn if we're not loading, not authenticated,
  // and not processing an OAuth callback
  useEffect(() => {
    if (
      !state.isLoading &&
      !state.isAuthenticated &&
      !signInTriggered.current &&
      !callbackPending
    ) {
      signInTriggered.current = true;
      signIn();
    }
  }, [state.isLoading, state.isAuthenticated, signIn, callbackPending]);

  if (state.isLoading || callbackPending) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Authenticating...</p>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Redirecting to sign in...</p>
      </div>
    );
  }

  return children;
}
