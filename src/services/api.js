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
  list: async (namespaceName) => {
    const response = await fetch(`/namespaces/${namespaceName}/projects`);
    const result = await handleResponse(response);
    return result.data?.items || [];
  },
  create: async (namespaceName, projectData) => {
    const response = await fetch(`/namespaces/${namespaceName}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    const result = await handleResponse(response);
    return result.data;
  },
  get: async (namespaceName, projectName) => {
    const response = await fetch(`/namespaces/${namespaceName}/projects/${projectName}`);
    const result = await handleResponse(response);
    return result.data;
  }
};

// Components API - using paths directly from OpenAPI spec
export const componentsAPI = {
  list: async (namespaceName, projectName) => {
    const response = await fetch(`/namespaces/${namespaceName}/projects/${projectName}/components`);
    const result = await handleResponse(response);
    return result.data?.items || [];
  },
  create: async (namespaceName, projectName, componentData) => {
    const response = await fetch(`/namespaces/${namespaceName}/projects/${projectName}/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(componentData),
    });
    const result = await handleResponse(response);
    return result.data;
  },
  get: async (namespaceName, projectName, componentName) => {
    const response = await fetch(`/namespaces/${namespaceName}/projects/${projectName}/components/${componentName}`);
    const result = await handleResponse(response);
    return result.data;
  }
};

