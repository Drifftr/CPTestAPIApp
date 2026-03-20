# CPTestAPIApp Onboarding Demo (Platform Console Reference)

This document is a code-accurate onboarding demo for platform console teams. It is derived from the current CPTestAPIApp implementation.

## What This Demo Covers

- OIDC authentication using Asgardeo (Thunder) with `@asgardeo/auth-react`.
- Token propagation to API calls via a render-time bridge.
- Org resolution from JWT claims (`ouHandle`, `ouName`).
- Project list and create.
- Component type discovery from the namespace (`GET /componenttypes`).
- Component list and create (with dropdown-driven component type and workflow selection).
- Build trigger (workflow run create with K8s-style envelope) and polling until terminal status.
- Deployment trigger (generate-release) and deployment details with resource tree visualization.
- Read-only retrieval of component details, workflow runs, release bindings, and release resource trees.

## What This Demo Does Not Cover

- Org membership or role management flows in PAS.
- Provisioning OAuth apps in the IdP.

CPTestAPIApp delegates **user and org creation** to the Platform IdP (Thunder). Users and orgs are created as part of the IdP login / signup / onboarding flow, and the app consumes the resulting token claims. There is a `consoleOrgsAPI.get()` method defined, but the UI does not call it; org context is derived from token claims in the frontend.

## Key Files And Roles

- `src/auth/AuthProvider.js`: Asgardeo SDK config and mock auth switch.
- `src/auth/AuthGuard.js`: Handles the OAuth callback race and blocks UI until authenticated.
- `src/auth/UserInfo.js`: Displays user name and org claim from tokens.
- `src/config/env.js`: Runtime env defaults.
- `src/services/api.js`: Authenticated fetch + API wrappers + K8s-to-flat normalization.
- `src/pages/ConsolePage.tsx`: Main console flow and E2E actions.
- `src/components/console/CreateComponentDialog.tsx`: Component creation with dynamic component type and workflow dropdowns.
- `src/components/console/CreateProjectDialog.tsx`: Project creation dialog.
- `src/components/console/DetailPanel.tsx`: Component details, build history, and deployment cards with resource tree expansion.
- `src/setupProxy.js`: CRA proxy for local dev (avoids CORS).

## Auth And Token Propagation

### OIDC Setup

The app uses `@asgardeo/auth-react` with the following inputs (from `src/config/env.js`):

- `REACT_APP_THUNDER_URL`
- `REACT_APP_THUNDER_CLIENT_ID`
- `REACT_APP_THUNDER_SCOPES`
- `REACT_APP_SIGN_IN_REDIRECT_URL`
- `REACT_APP_SIGN_OUT_REDIRECT_URL`

### Token Bridge

API helpers live in plain JS, so CPTestAPIApp passes a token accessor function from React into `services/api.js`. This happens during render in `src/App.js` to avoid a race with child effects.

## API Base And Proxy Behavior

`src/services/api.js` uses this base rule:

- If `REACT_APP_API_BASE_URL` is set, requests go to `${REACT_APP_API_BASE_URL}/wso2cloud-dp`.
- If empty, requests go to `/oc-api` which is proxied by CRA to `http://development-wso2cloud.openchoreoapis.localhost:19080/platform-api-service-platform-api-endpoint` in `src/setupProxy.js`.

For browser-based local dev, keep `REACT_APP_API_BASE_URL` empty so the proxy avoids CORS issues.

### Proxy hostname

The proxy target is `development-wso2cloud.openchoreoapis.localhost:19080`. The hostname is derived from the OC namespace: `development-{namespace}.openchoreoapis.localhost`. Since the platform components live in the `wso2cloud` namespace, the hostname is `development-wso2cloud`.

## API Map

All calls include `Authorization: Bearer <access_token>`. All request/response bodies use K8s-style envelope (`{ metadata, spec, status }`). The API layer normalizes responses to flat objects for the UI.

### Endpoints used

| Method | Path | Description |
|--------|------|-------------|
| GET | `/orgs/:handle` | Org details (defined, not used by UI) |
| GET | `/projects` | List projects |
| POST | `/projects` | Create project |
| GET | `/projects/:projectName` | Get project |
| GET | `/componenttypes` | List available component types in namespace |
| GET | `/components?labelSelector=openchoreo.dev/project=:project` | List components in project |
| POST | `/components` | Create component |
| GET | `/components/:componentName` | Get component |
| GET | `/workflowruns` | List all workflow runs (filtered client-side by component label) |
| POST | `/workflowruns` | Create workflow run (trigger build) |
| GET | `/componentreleases?component=:component` | List component releases |
| GET | `/releasebindings?component=:component` | List release bindings |
| GET | `/releasebindings/:name/k8sresources/tree` | Get deployed resource tree |
| POST | `/components/:component/generate-release` | Generate release (trigger deploy) |

## K8s-Style Request Bodies

All mutating API calls send K8s-style bodies with `metadata` and `spec` sections. The `api.js` layer constructs these from the UI's flat form data.

### Create project

```json
{
  "metadata": {
    "name": "my-project",
    "annotations": {
      "openchoreo.dev/display-name": "My Project",
      "openchoreo.dev/description": "A brief description"
    }
  },
  "spec": {
    "deploymentPipelineRef": { "name": "default-pipeline" }
  }
}
```

### Create component

```json
{
  "metadata": {
    "name": "my-service",
    "annotations": {
      "openchoreo.dev/display-name": "My Service",
      "openchoreo.dev/description": "Brief description"
    }
  },
  "spec": {
    "owner": { "projectName": "my-project" },
    "componentType": {
      "kind": "ClusterComponentType",
      "name": "deployment/service"
    },
    "workflow": {
      "kind": "ClusterWorkflow",
      "name": "gcp-buildpacks-builder",
      "parameters": {
        "repository": {
          "url": "https://github.com/org/repo",
          "revision": { "branch": "main" },
          "appPath": "/"
        }
      }
    }
  }
}
```

Note: The UI sends `systemParameters.repository` but `api.js` maps it to `parameters.repository` in the K8s body.

### Create workflow run (trigger build)

```json
{
  "metadata": {
    "name": "my-service-mmyjthtk",
    "labels": {
      "openchoreo.dev/component": "my-service",
      "openchoreo.dev/project": "my-project"
    }
  },
  "spec": {
    "workflow": {
      "kind": "ClusterWorkflow",
      "name": "gcp-buildpacks-builder",
      "parameters": {
        "repository": {
          "url": "https://github.com/org/repo",
          "revision": { "branch": "main" },
          "appPath": "/"
        }
      }
    }
  }
}
```

The `metadata.name` is auto-generated as `{componentName}-{timestamp_base36}`.

### Generate release (trigger deploy)

```json
{
  "releaseName": "optional-name"
}
```

## Component Type And Workflow Selection

Component types are fetched dynamically from `GET /componenttypes` when the create dialog opens. Each type includes `workloadType` and `name`, displayed as `service (deployment)`, `web-application (deployment)`, etc.

Workflow options are mapped per component type to the actual ClusterWorkflow names on the cluster:

| Component Type | Available Workflows |
|---|---|
| `deployment/service` | `gcp-buildpacks-builder`, `paketo-buildpacks-builder`, `ballerina-buildpack-builder`, `dockerfile-builder` |
| `deployment/worker` | `gcp-buildpacks-builder`, `paketo-buildpacks-builder`, `dockerfile-builder` |
| `deployment/web-application` | `dockerfile-builder`, `paketo-buildpacks-builder`, `gcp-buildpacks-builder` |
| `cronjob/scheduled-task` | `gcp-buildpacks-builder`, `paketo-buildpacks-builder`, `dockerfile-builder` |

## Response Normalization

The OC API returns K8s-style resources (`{ metadata, spec, status }`). The `api.js` layer normalizes these to flat objects for the UI:

- **Projects**: `name`, `displayName`, `deploymentPipeline`, `status`
- **Components**: `name`, `type`, `projectName`, `autoDeploy`, `workflow`, `status`
- **Workflow Runs**: `name`, `componentName`, `status`, `commit`, `image` (from publish-image step output)
- **Release Bindings**: `name`, `componentName`, `environment`, `releaseName`, `state`, `status`
- **Resource Tree**: API returns `{ renderedReleases: [{ nodes: [...] }] }`; `api.js` extracts the first entry so the UI accesses `envRelease.nodes` directly

## Deployment Card

The deployment card shows release bindings with:

- **Image**: Resolved from workflow run's `publish-image` step output, with fallback to the Deployment container image from the resource tree
- **Status**: From the release binding's latest condition reason
- **Expandable details**: Click a deployment row to see HTTPRoute hostnames, Service ports, and the full K8s resource tree (Deployment, Pod, Service, NetworkPolicy)

## End To End Flow In The UI

1. User signs in via OIDC. `AuthGuard` blocks UI until authenticated.
2. Org is derived from token claims (`ouHandle`, `ouName`). No org API call is required.
3. Projects are listed via `GET /projects`.
4. Create project dialog submits `POST /projects` (K8s envelope) and refreshes the list.
5. Expanding a project loads components via `GET /components?labelSelector=openchoreo.dev/project=:project`.
6. Create component dialog:
   - Fetches available component types from `GET /componenttypes`
   - Shows component type as a dropdown (e.g. `service (deployment)`)
   - Shows workflow options filtered by component type (actual ClusterWorkflow names)
   - Submits `POST /components` with K8s envelope
7. Selecting a component loads:
   - `GET /components/:component`
   - `GET /workflowruns` (all runs, filtered client-side by `openchoreo.dev/component` label)
   - `GET /releasebindings?component=:component`
   - For each binding: `GET /releasebindings/:name/k8sresources/tree`
8. Build triggers `POST /workflowruns` (K8s envelope with generated name and labels) and starts polling every 5s until a terminal status is reached.
9. Deploy triggers `POST /components/:component/generate-release` (platform auto-deploys if `autoDeploy: true`).
10. Deployment details show image, status, and expandable resource tree from the rendered release.

## Running The Demo

```bash
cd CPTestAPIApp
npm install
npm start
```

To bypass auth locally:

```bash
REACT_APP_DEV_BYPASS_AUTH=true npm start
```

## Console Integration Checklist

- Use OIDC and obtain access tokens for API calls.
- Propagate access tokens to your API client (avoid races with render-time bridge).
- Derive org context from token claims or fetch org by handle.
- All mutating API calls must use K8s-style bodies (`{ metadata, spec }`).
- Fetch component types from `GET /componenttypes` for dynamic dropdowns.
- Send `componentType` as `{ kind: "ClusterComponentType", name: "deployment/service" }`.
- Send workflow as `{ kind: "ClusterWorkflow", name: "gcp-buildpacks-builder" }` — names must match actual ClusterWorkflows on the cluster.
- Map `systemParameters.repository` to `parameters.repository` in K8s bodies.
- Use `POST /workflowruns` with `metadata.name` (auto-generated) and component/project labels to trigger builds.
- Use `POST /components/:component/generate-release` to deploy.
- Use `GET /releasebindings/:name/k8sresources/tree` and extract `renderedReleases[0]` for deployment resource details.
- In browser-based dev, use a server-side proxy to avoid CORS header stripping.
