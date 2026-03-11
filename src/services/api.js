import env from '../config/env';

let _getAccessToken = null;

export function setTokenAccessor(fn) {
  _getAccessToken = fn;
}

async function authenticatedFetch(url, options = {}) {
  if (_getAccessToken) {
    try {
      const token = await _getAccessToken();
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    } catch (err) {
      console.warn('Failed to get access token:', err);
    }
  }
  const response = await fetch(url, options);
  if (response.status === 401) {
    const error = new Error('Unauthorized');
    error.status = 401;
    throw error;
  }
  if (response.status === 403) {
    const error = new Error('Permission denied');
    error.status = 403;
    throw error;
  }
  return handleResponse(response);
}

async function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data;
}

// OpenChoreo API prefix — routed through platform-api-service.
// If API_BASE_URL is empty, fall back to local CRA proxy path (/oc-api/*).
const OC_API_PREFIX = env.API_BASE_URL
  ? `${env.API_BASE_URL.replace(/\/$/, '')}/wso2cloud-dp`
  : '/oc-api';

// --- Console APIs (swagger paths under /platform-api-service/wso2cloud-dp/) ---
// These use the same proxy prefix as legacy APIs but with flat URL structure
// (namespace inferred from JWT, not in URL path).

export const consoleOrgsAPI = {
  get: async (orgHandle) => {
    const result = await authenticatedFetch(`${OC_API_PREFIX}/orgs/${orgHandle}`);
    return result.data;
  },
};

export const consoleProjectsAPI = {
  list: async () => {
    const result = await authenticatedFetch(`${OC_API_PREFIX}/projects`);
    return result.data?.items || [];
  },
  get: async (projectName) => {
    const result = await authenticatedFetch(`${OC_API_PREFIX}/projects/${projectName}`);
    return result.data;
  },
  create: async (data) => {
    const result = await authenticatedFetch(`${OC_API_PREFIX}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return result.data;
  },
};

export const consoleComponentsAPI = {
  list: async (projectName) => {
    const result = await authenticatedFetch(
      `${OC_API_PREFIX}/projects/${projectName}/components`
    );
    return result.data?.items || [];
  },
  get: async (projectName, componentName) => {
    const result = await authenticatedFetch(
      `${OC_API_PREFIX}/projects/${projectName}/components/${componentName}`
    );
    return result.data;
  },
  create: async (projectName, data) => {
    const result = await authenticatedFetch(
      `${OC_API_PREFIX}/projects/${projectName}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    return result.data;
  },
};

export const workflowRunsAPI = {
  list: async (projectName, componentName) => {
    const result = await authenticatedFetch(
      `${OC_API_PREFIX}/projects/${projectName}/components/${componentName}/workflow-runs`
    );
    return result.data?.items || [];
  },
  create: async (projectName, componentName, payload) => {
    const result = await authenticatedFetch(
      `${OC_API_PREFIX}/projects/${projectName}/components/${componentName}/workflow-runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    return result.data;
  },
};
