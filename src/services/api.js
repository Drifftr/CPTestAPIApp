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

// --- K8s → flat normalization helpers ---
// The OC API returns K8s-style resources: { metadata, spec, status }.
// UI components expect flat objects: { name, displayName, status, ... }.
// Each normalizer maps the K8s fields to what the UI types expect.

function metaFields(item) {
  if (!item?.metadata) return {};
  const m = item.metadata;
  const a = m.annotations || {};
  return {
    uid: m.uid,
    name: m.name,
    namespaceName: m.namespace,
    displayName: a['openchoreo.dev/display-name'],
    description: a['openchoreo.dev/description'],
    createdAt: m.creationTimestamp,
  };
}

function latestConditionReason(item) {
  const conditions = item?.status?.conditions;
  if (!Array.isArray(conditions) || conditions.length === 0) return undefined;
  return conditions[conditions.length - 1]?.reason;
}

function normalizeProject(item) {
  if (!item?.metadata) return item;
  return {
    ...metaFields(item),
    deploymentPipeline: item.spec?.deploymentPipelineRef?.name,
    status: latestConditionReason(item),
  };
}

function normalizeComponent(item) {
  if (!item?.metadata) return item;
  const labels = item.metadata.labels || {};
  return {
    ...metaFields(item),
    type: item.spec?.componentType?.name || labels['openchoreo.dev/component-type'] || '—',
    projectName: item.spec?.owner?.projectName || labels['openchoreo.dev/project-name'],
    autoDeploy: item.spec?.autoDeploy ?? false,
    workflow: item.spec?.workflow ? {
      kind: item.spec.workflow.kind,
      name: item.spec.workflow.name,
      systemParameters: {
        repository: item.spec.workflow.parameters?.repository,
      },
    } : undefined,
    workload: item.spec?.workload,
    status: latestConditionReason(item),
  };
}

function normalizeWorkflowRun(item) {
  if (!item?.metadata) return item;
  const labels = item.metadata.labels || {};
  const tasks = item.status?.tasks || [];
  // Find the publish-image step output for the image tag
  const publishStep = tasks.find(t => t.name === 'publish-image');
  return {
    ...metaFields(item),
    componentName: labels['openchoreo.dev/component'],
    projectName: labels['openchoreo.dev/project'],
    status: item.status?.conditions?.find(c => c.type === 'WorkflowCompleted')?.reason
      || (item.status?.conditions?.find(c => c.type === 'WorkflowRunning' && c.status === 'True') ? 'Running' : 'Pending'),
    commit: item.status?.tasks?.find(t => t.name === 'checkout-source')?.outputs?.parameters?.find(p => p.name === 'git-revision')?.value,
    image: publishStep?.outputs?.parameters?.find(p => p.name === 'image')?.value,
    workflow: item.spec?.workflow ? {
      kind: item.spec.workflow.kind,
      name: item.spec.workflow.name,
      systemParameters: {
        repository: item.spec.workflow.parameters?.repository,
      },
    } : undefined,
  };
}

function normalizeReleaseBinding(item) {
  if (!item?.metadata) return item;
  const labels = item.metadata.labels || {};
  return {
    ...metaFields(item),
    componentName: labels['openchoreo.dev/component'],
    projectName: labels['openchoreo.dev/project'],
    environment: item.spec?.environment || labels['openchoreo.dev/environment'],
    releaseName: item.spec?.releaseName,
    state: item.spec?.state,
    status: latestConditionReason(item),
  };
}

// OpenChoreo API prefix — routed through platform-api-service.
// If API_BASE_URL is empty, fall back to local CRA proxy path (/oc-api/*).
const OC_API_PREFIX = env.API_BASE_URL
  ? `${env.API_BASE_URL.replace(/\/$/, '')}/wso2cloud-dp`
  : '/oc-api';

// --- Console APIs ---

export const consoleOrgsAPI = {
  get: async (orgHandle) => {
    return authenticatedFetch(`${OC_API_PREFIX}/orgs/${orgHandle}`);
  },
};

export const consoleProjectsAPI = {
  list: async () => {
    const result = await authenticatedFetch(`${OC_API_PREFIX}/projects`);
    return (result.items || []).map(normalizeProject);
  },
  get: async (projectName) => {
    const result = await authenticatedFetch(`${OC_API_PREFIX}/projects/${projectName}`);
    return normalizeProject(result);
  },
  create: async (data) => {
    const body = {
      metadata: {
        name: data.name,
        ...(data.displayName || data.description ? {
          annotations: {
            ...(data.displayName ? { 'openchoreo.dev/display-name': data.displayName } : {}),
            ...(data.description ? { 'openchoreo.dev/description': data.description } : {}),
          },
        } : {}),
      },
      spec: {
        ...(data.deploymentPipeline ? {
          deploymentPipelineRef: { name: data.deploymentPipeline },
        } : {}),
      },
    };
    const result = await authenticatedFetch(`${OC_API_PREFIX}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return normalizeProject(result);
  },
};

export const consoleComponentsAPI = {
  list: async (projectName) => {
    const result = await authenticatedFetch(
      `${OC_API_PREFIX}/components?labelSelector=openchoreo.dev/project=${projectName}`
    );
    return (result.items || []).map(normalizeComponent);
  },
  get: async (projectName, componentName) => {
    const result = await authenticatedFetch(
      `${OC_API_PREFIX}/components/${componentName}`
    );
    return normalizeComponent(result);
  },
  create: async (projectName, data) => {
    const body = {
      metadata: {
        name: data.name,
        ...(data.displayName || data.description ? {
          annotations: {
            ...(data.displayName ? { 'openchoreo.dev/display-name': data.displayName } : {}),
            ...(data.description ? { 'openchoreo.dev/description': data.description } : {}),
          },
        } : {}),
      },
      spec: {
        owner: { projectName },
        componentType: {
          kind: data.componentType?.kind || 'ClusterComponentType',
          name: data.componentType?.name || data.componentType,
        },
        ...(data.autoDeploy != null ? { autoDeploy: data.autoDeploy } : {}),
        ...(data.workflow ? {
          workflow: {
            kind: data.workflow.kind || 'ClusterWorkflow',
            name: data.workflow.name,
            ...(data.workflow.systemParameters?.repository ? {
              parameters: {
                repository: data.workflow.systemParameters.repository,
              },
            } : {}),
          },
        } : {}),
      },
    };
    const result = await authenticatedFetch(
      `${OC_API_PREFIX}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    return normalizeComponent(result);
  },
  generateRelease: async (componentName, releaseName) => {
    return authenticatedFetch(
      `${OC_API_PREFIX}/components/${componentName}/generate-release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(releaseName ? { releaseName } : {}),
      }
    );
  },
};

export const workflowRunsAPI = {
  list: async (projectName, componentName) => {
    const result = await authenticatedFetch(
      `${OC_API_PREFIX}/workflowruns?workflow=${componentName}`
    );
    return (result.items || []).map(normalizeWorkflowRun);
  },
  create: async (projectName, componentName, payload) => {
    return authenticatedFetch(
      `${OC_API_PREFIX}/workflowruns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
  },
};

export const componentReleasesAPI = {
  list: async (componentName) => {
    const result = await authenticatedFetch(
      `${OC_API_PREFIX}/componentreleases?component=${componentName}`
    );
    return (result.items || []).map(item => ({
      ...metaFields(item),
      ...item,
    }));
  },
};

export const releaseBindingsAPI = {
  list: async (projectName, componentName) => {
    const result = await authenticatedFetch(
      `${OC_API_PREFIX}/releasebindings?component=${componentName}`
    );
    return (result.items || []).map(normalizeReleaseBinding);
  },
  getResourceTree: async (releaseBindingName) => {
    return authenticatedFetch(
      `${OC_API_PREFIX}/releasebindings/${releaseBindingName}/k8sresources/tree`
    );
  },
};
