import React, { useEffect, useState } from 'react';
import useAuth from './useAuth';
import './UserInfo.css';

export default function UserInfo() {
  const { state, signOut, getDecodedIDToken, getAccessToken } = useAuth();
  const [userDisplay, setUserDisplay] = useState({ name: '', org: '' });

  useEffect(() => {
    if (!state.isAuthenticated) return;

    async function loadUserInfo() {
      try {
        const idToken = await getDecodedIDToken();
        let orgName = idToken?.ouName;

        // Fallback: read ouName from access_token if id_token doesn't have it
        // (Thunder v0.22.0 bug — scope_claims gate filters out OU claims from id_token)
        if (!orgName) {
          try {
            const accessToken = await getAccessToken();
            const payload = accessToken.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            orgName = decoded.ouName;
          } catch {
            // ignore decode errors
          }
        }

        setUserDisplay({
          name: idToken?.given_name
            ? `${idToken.given_name} ${idToken.family_name || ''}`.trim()
            : state.displayName || state.username || 'User',
          org: orgName || 'Unknown Organization',
        });
      } catch {
        setUserDisplay({
          name: state.displayName || state.username || 'User',
          org: 'Unknown Organization',
        });
      }
    }

    loadUserInfo();
  }, [state.isAuthenticated, state.displayName, state.username, getDecodedIDToken, getAccessToken]);

  if (!state.isAuthenticated) return null;

  return (
    <div className="user-info-bar">
      <div className="user-info-left">
        <span className="user-name">{userDisplay.name}</span>
        <span className="user-org">{userDisplay.org}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="sign-out-btn" onClick={() => signOut()}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
