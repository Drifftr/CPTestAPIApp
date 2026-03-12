# CPTestAPIApp Onboarding Demo (Platform Console Reference)

This document is a code-accurate onboarding demo for platform console teams. It is derived from the current CPTestAPIApp implementation, not from older READMEs.

## What This Demo Covers

- OIDC authentication using Asgardeo (Thunder) with `@asgardeo/auth-react`.
- Token propagation to API calls via a render-time bridge.
- Org resolution from JWT claims (`ouHandle`, `ouName`).
- Project list and create.
- Component list and create (with optional workflow config).
- Build trigger (workflow run create) and polling until terminal status.
- Deployment trigger (release create + deploy) and deployment details.
- Read-only retrieval of component details, workflow runs, release bindings, and environment release resources.

## What This Demo Does Not Cover

- Org membership or role management flows in PAS.
- Provisioning OAuth apps in the IdP.

CPTestAPIApp delegates **user and org creation** to the Platform IdP (Thunder). In other words, users and orgs are created as part of the IdP login / signup / onboarding flow, and the app consumes the resulting token claims. There is a `consoleOrgsAPI.get()` method defined, but the UI does not call it; org context is derived from token claims in the frontend.

## Key Files And Roles

- `CPTestAPIApp/src/auth/AuthProvider.js`: Asgardeo SDK config and mock auth switch.
- `CPTestAPIApp/src/auth/AuthGuard.js`: Handles the OAuth callback race and blocks UI until authenticated.
- `CPTestAPIApp/src/auth/UserInfo.js`: Displays user name and org claim from tokens.
- `CPTestAPIApp/src/config/env.js`: Runtime env defaults.
- `CPTestAPIApp/src/services/api.js`: Authenticated fetch + API wrappers.
- `CPTestAPIApp/src/pages/ConsolePage.tsx`: Main console flow and E2E actions.
- `CPTestAPIApp/src/components/console/*.tsx`: UI dialogs and details.
- `CPTestAPIApp/src/setupProxy.js`: CRA proxy for local dev (avoids CORS).

## Auth And Token Propagation

### OIDC Setup

The app uses `@asgardeo/auth-react` with the following inputs (from `CPTestAPIApp/src/config/env.js`):

- `REACT_APP_THUNDER_URL`
- `REACT_APP_THUNDER_CLIENT_ID`
- `REACT_APP_THUNDER_SCOPES`
- `REACT_APP_SIGN_IN_REDIRECT_URL`
- `REACT_APP_SIGN_OUT_REDIRECT_URL`

### Token Bridge

API helpers live in plain JS, so CPTestAPIApp passes a token accessor function from React into `services/api.js`. This happens during render in `CPTestAPIApp/src/App.js` to avoid a race with child effects.

## API Base And Proxy Behavior

`CPTestAPIApp/src/services/api.js` uses this base rule:

- If `REACT_APP_API_BASE_URL` is set, requests go to `${REACT_APP_API_BASE_URL}/wso2cloud-dp`.
- If empty, requests go to `/oc-api` which is proxied by CRA to `http://default.development.openchoreoapis.localhost:19080/platform-api-service/wso2cloud-dp` in `CPTestAPIApp/src/setupProxy.js`.

For browser-based local dev, keep `REACT_APP_API_BASE_URL` empty so the proxy avoids CORS issues.

## API Map

All calls include `Authorization: Bearer <access_token>`.

- `GET /orgs/:handle` (defined, not used by UI)
- `GET /projects`
- `POST /projects`
- `GET /projects/:projectName`
- `GET /projects/:projectName/components`
- `POST /projects/:projectName/components`
- `GET /projects/:projectName/components/:componentName`
- `GET /projects/:projectName/components/:componentName/workflow-runs`
- `POST /projects/:projectName/components/:componentName/workflow-runs`
- `POST /projects/:projectName/components/:componentName/component-releases`
- `GET /projects/:projectName/components/:componentName/component-releases`
- `GET /projects/:projectName/components/:componentName/release-bindings`
- `GET /projects/:projectName/components/:componentName/environments/:environment/release`
- `POST /projects/:projectName/components/:componentName/deploy`
- `POST /projects/:projectName/components/:componentName/promote`

## Payload Examples (From Current UI)

Create project (`CPTestAPIApp/src/components/console/CreateProjectDialog.tsx`):

```json
{
  "name": "my-project",
  "displayName": "My Project",
  "description": "A brief description",
  "deploymentPipeline": "default-pipeline"
}
```

Create component (`CPTestAPIApp/src/components/console/CreateComponentDialog.tsx`):

```json
{
  "name": "my-service",
  "displayName": "My Service",
  "description": "Brief description",
  "componentType": "deployment/service",
  "workflow": {
    "name": "my-service-build",
    "systemParameters": {
      "repository": {
        "url": "https://github.com/org/repo",
        "revision": { "branch": "main" },
        "appPath": "/"
      }
    }
  }
}
```

Trigger build (`CPTestAPIApp/src/pages/ConsolePage.tsx`):

```json
{
  "workflow": { "...": "component.componentWorkflow" }
}
```

Trigger deploy (`CPTestAPIApp/src/pages/ConsolePage.tsx`):

```json
{
  "releaseName": "<from component-releases response>"
}
```

Promote (API is defined but not wired in UI):

```json
{
  "sourceEnv": "dev",
  "targetEnv": "prod"
}
```

## End To End Flow In The UI

1. User signs in via OIDC. `AuthGuard` blocks UI until authenticated.
2. Org is derived from token claims (`ouHandle`, `ouName`). No org API call is required.
3. Projects are listed via `GET /projects`.
4. Create project dialog submits `POST /projects` and refreshes the list.
5. Expanding a project loads components via `GET /projects/:project/components`.
6. Create component dialog submits `POST /projects/:project/components`.
7. Selecting a component loads:
   - `GET /projects/:project/components/:component`
   - `GET /projects/:project/components/:component/workflow-runs`
   - `GET /projects/:project/components/:component/release-bindings`
   - For each binding: `GET /projects/:project/components/:component/environments/:env/release`
8. Build triggers `POST /workflow-runs` and starts polling every 5s until a terminal status is reached.
9. Deploy triggers `POST /component-releases` then `POST /deploy`.
10. Deployment details are refreshed via the release binding and environment release APIs.

## UI Action To Code Mapping

- Sign in and sign out: `CPTestAPIApp/src/auth/AuthGuard.js`, `CPTestAPIApp/src/auth/UserInfo.js`.
- Org resolution: `CPTestAPIApp/src/pages/ConsolePage.tsx` (function `resolveOrg`).
- Project list/create: `CPTestAPIApp/src/pages/ConsolePage.tsx` and `CPTestAPIApp/src/components/console/CreateProjectDialog.tsx`.
- Component list/create: `CPTestAPIApp/src/pages/ConsolePage.tsx` and `CPTestAPIApp/src/components/console/CreateComponentDialog.tsx`.
- Build trigger and polling: `CPTestAPIApp/src/pages/ConsolePage.tsx` (`handleBuild` and polling loop).
- Deploy trigger: `CPTestAPIApp/src/pages/ConsolePage.tsx` (`handleDeploy`).
- Deployment display: `CPTestAPIApp/src/components/console/DetailPanel.tsx`.

## Running The Demo

```bash
cd /Users/yomal/Documents/Openchoreo-local/CPTestAPIApp
npm install
npm start
```

To bypass auth locally:

```bash
REACT_APP_DEV_BYPASS_AUTH=true npm start
```

## Console Integration Checklist

- Use OIDC and obtain access tokens for API calls.
- Propagate access tokens to your API client (avoid races).
- Derive org context from token claims or fetch org by handle.
- Use `GET /projects` and `POST /projects` to manage projects.
- Use `GET /projects/:project/components` and `POST /projects/:project/components` to manage components.
- Use `POST /workflow-runs` to trigger builds and poll until terminal status.
- Use `POST /component-releases` then `POST /deploy` to deploy.
- Use release bindings and environment release APIs to surface deployment details.
- In browser-based dev, use a server-side proxy to avoid CORS header stripping.
