import React from 'react';
import ReactDOM from 'react-dom/client';
import { OxygenUIThemeProvider, AcrylicOrangeTheme } from '@wso2/oxygen-ui';
import './index.css';
import App from './App';
import AppAuthProvider from './auth/AuthProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <OxygenUIThemeProvider theme={AcrylicOrangeTheme}>
      <AppAuthProvider>
        <App />
      </AppAuthProvider>
    </OxygenUIThemeProvider>
  </React.StrictMode>
);
