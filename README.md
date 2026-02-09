# CPAPI Test Application

A React single page application for managing organizations, projects, and components using the CPAPI backend.

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

The application is configured to use the backend at:
```
http://development.wso2cloud-cp.preview-dv.choreoapis.dev/platform-api-service/cpapi/api/v1
```

### CORS Proxy Setup

To handle CORS errors in development, a proxy is configured using `http-proxy-middleware`. The proxy:
- Intercepts requests to `/api/*` 
- Forwards them to the backend server
- Handles CORS headers automatically

The proxy configuration is in `src/setupProxy.js`. In production, you would need to configure CORS on the backend server or use a reverse proxy.

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

- No authentication/authorization is implemented as per requirements
- Form fields are plain text inputs without validation
- All URLs are hardcoded for this demo application

