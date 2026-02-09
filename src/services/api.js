// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data;
}

// Organizations API - using paths directly from OpenAPI spec
export const organizationsAPI = {
  list: async () => {
    const response = await fetch('/orgs');
    const result = await handleResponse(response);
    return result.data?.items || [];
  }
};

// Projects API - using paths directly from OpenAPI spec
export const projectsAPI = {
  list: async (orgName) => {
    const response = await fetch(`/orgs/${orgName}/projects`);
    const result = await handleResponse(response);
    return result.data?.items || [];
  },
  create: async (orgName, projectData) => {
    const response = await fetch(`/orgs/${orgName}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    const result = await handleResponse(response);
    return result.data;
  },
  get: async (orgName, projectName) => {
    const response = await fetch(`/orgs/${orgName}/projects/${projectName}`);
    const result = await handleResponse(response);
    return result.data;
  }
};

// Components API - using paths directly from OpenAPI spec
export const componentsAPI = {
  list: async (orgName, projectName) => {
    const response = await fetch(`/orgs/${orgName}/projects/${projectName}/components`);
    const result = await handleResponse(response);
    return result.data?.items || [];
  },
  create: async (orgName, projectName, componentData) => {
    const response = await fetch(`/orgs/${orgName}/projects/${projectName}/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(componentData),
    });
    const result = await handleResponse(response);
    return result.data;
  },
  get: async (orgName, projectName, componentName) => {
    const response = await fetch(`/orgs/${orgName}/projects/${projectName}/components/${componentName}`);
    const result = await handleResponse(response);
    return result.data;
  }
};

