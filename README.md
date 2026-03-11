# CPAPI Test Application

A React single page application for managing organizations, projects, and components through `platform-api-service` in a local OpenChoreo cluster.

## Features

- **Organization Management**: Select and switch between organizations via dropdown
- **Project Management**: 
  - View projects as tiles on the landing page
  - Create new projects with a simple form
- **Component Management**:
  - View components within a project
  - Create new components with a form
  - View detailed component information

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Backend Configuration

Default backend base URL:
```bash
REACT_APP_API_BASE_URL=http://default.development.openchoreoapis.localhost:19080/platform-api-service
```

With this setting, the app routes OC operations via:
```text
{REACT_APP_API_BASE_URL}/wso2cloud-dp/*
```

### Fallback Proxy Setup

If you clear `REACT_APP_API_BASE_URL`, the app falls back to CRA proxy mode using `http-proxy-middleware`:
- Intercepts requests to `/oc-api/*`
- Forwards to `http://default.development.openchoreoapis.localhost:19080/platform-api-service/wso2cloud-dp/*`
- Forwards browser `Authorization` header as-is (no proxy token injection)

Fallback proxy configuration is in `src/setupProxy.js`.

## Project Structure

```
src/
  ├── components/          # Reusable components
  │   ├── OrganizationSelector.js
  │   ├── CreateProjectModal.js
  │   └── CreateComponentModal.js
  ├── pages/              # Page components
  │   ├── LandingPage.js
  │   ├── ProjectPage.js
  │   └── ComponentDetailPage.js
  ├── services/           # API service functions
  │   └── api.js
  ├── App.js             # Main app component with routing
  └── index.js           # Entry point
```

## Usage

1. **Select Organization**: Use the dropdown at the top to select an organization
2. **View Projects**: Projects are displayed as tiles on the landing page
3. **Create Project**: Click "Create New Project" button and fill in the form
4. **View Components**: Click on a project tile to see its components
5. **Create Component**: Click "Create New Component" button and fill in the form
6. **View Component Details**: Click on a component tile to see detailed information

## Notes

- Authentication token comes from the app auth provider and is sent as bearer token on API calls
- Proxy-side system token acquisition is removed
- Form fields are plain text inputs without validation
