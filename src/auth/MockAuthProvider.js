import React, { createContext, useContext, useCallback } from 'react';

const MOCK_USER = {
  sub: 'mock-admin-001',
  email: 'admin@openchoreo.dev',
  given_name: 'Admin',
  family_name: 'User',
  ouId: 'org-001',
  ouName: 'Default Organization',
  ouHandle: 'default',
};

const MOCK_STATE = {
  isAuthenticated: true,
  isLoading: false,
  username: MOCK_USER.email,
  displayName: `${MOCK_USER.given_name} ${MOCK_USER.family_name}`,
};

const MockAuthContext = createContext(undefined);

export function MockAuthProvider({ children }) {
  const signIn = useCallback(() => {
    console.log('[MockAuth] signIn() called — no-op in bypass mode');
  }, []);

  const signOut = useCallback(() => {
    console.log('[MockAuth] signOut() called — no-op in bypass mode');
  }, []);

  const getAccessToken = useCallback(async () => {
    return 'mock-access-token';
  }, []);

  const getDecodedIDToken = useCallback(async () => {
    return MOCK_USER;
  }, []);

  const value = {
    state: MOCK_STATE,
    signIn,
    signOut,
    getAccessToken,
    getDecodedIDToken,
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuthContext() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) {
    throw new Error('useMockAuthContext must be used within MockAuthProvider');
  }
  return ctx;
}
