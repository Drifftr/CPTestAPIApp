import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './auth/useAuth';
import AuthGuard from './auth/AuthGuard';
import UserInfo from './auth/UserInfo';
import { setTokenAccessor } from './services/api';
import ConsolePage from './pages/ConsolePage';
import './App.css';

function App() {
  const { state, getAccessToken } = useAuth();

  // Set the token accessor synchronously during render rather than in
  // useEffect.  Child components (ConsolePage tree) fire API calls in
  // their own mount effects, which can run *before* a parent useEffect,
  // causing a race where _getAccessToken is still null → no Authorization
  // header → 401.  Assigning during render guarantees the accessor is
  // available before any child effects execute.
  if (state.isAuthenticated) {
    setTokenAccessor(() => getAccessToken());
  }

  return (
    <Router>
      <div className="App">
        <AuthGuard>
          <UserInfo />
          <Routes>
            <Route path="/" element={<ConsolePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthGuard>
      </div>
    </Router>
  );
}

export default App;
