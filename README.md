# CPTestAPIApp

React console demo that shows end-to-end integration with Platform API Service (PAS) using Asgardeo (Thunder) OIDC. It demonstrates auth, project and component management, build triggers, deployment triggers, and read-only retrieval of workflow runs and deployment details.

For the platform-console onboarding guide, see:
- `../docs/cptestapp-onboarding-demo.md`

## Features

- OIDC auth with `@asgardeo/auth-react` and a dev bypass mode.
- Org context resolved from JWT claims (no org API call required).
- Resource tree UI (org -> projects -> components).
- Create project and create component (optional workflow config).
- Trigger build (workflow run create) and poll status.
- Trigger deploy (create release + deploy) and view release bindings.

## Quick Start

```bash
cd /Users/yomal/Documents/Openchoreo-local/CPTestAPIApp
npm install
npm start
```

Bypass auth locally:

```bash
REACT_APP_DEV_BYPASS_AUTH=true npm start
```

For browser-based local dev, keep `REACT_APP_API_BASE_URL` empty so the CRA proxy in `src/setupProxy.js` avoids CORS issues.

## Configuration

Defaults are in `src/config/env.js`:

- `REACT_APP_THUNDER_URL` (default `http://platform-idp.127.0.0.1.nip.io:19080`)
- `REACT_APP_THUNDER_CLIENT_ID` (default `CLOUD_CONSOLE`)
- `REACT_APP_THUNDER_SCOPES` (default `openid profile email`)
- `REACT_APP_SIGN_IN_REDIRECT_URL` (default `http://localhost:3000`)
- `REACT_APP_SIGN_OUT_REDIRECT_URL` (default `http://localhost:3000`)
- `REACT_APP_API_BASE_URL` (empty by default; empty means CRA proxy mode)
- `REACT_APP_DEV_BYPASS_AUTH` (`true` to use MockAuthProvider)

## Project Structure

```
src/
  auth/
    AuthProvider.js
    AuthGuard.js
    MockAuthProvider.js
    UserInfo.js
  components/
    console/
      CreateProjectDialog.tsx
      CreateComponentDialog.tsx
      DetailPanel.tsx
      ResourceTree.tsx
  config/
    env.js
  pages/
    ConsolePage.tsx
  services/
    api.js
  setupProxy.js
  App.js
  index.js
```

## Notes

- User and org creation are delegated to the Platform IdP (Thunder) during login or signup; the app consumes the resulting token claims.
- Org context is derived from token claims (`ouHandle`, `ouName`).
- API calls always include `Authorization: Bearer <token>` from the auth provider.
