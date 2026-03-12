export interface PASNamespace {
  name: string;
  displayName?: string;
  description?: string;
  createdAt?: string;
  status?: string;
}

export interface PASProject {
  uid: string;
  name: string;
  namespaceName: string;
  displayName?: string;
  description?: string;
  deploymentPipeline?: string;
  createdAt: string;
  status?: string;
}

export interface ComponentWorkflowConfig {
  name?: string;
  systemParameters?: {
    repository?: {
      url?: string;
      revision?: { branch?: string; commit?: string };
      appPath?: string;
    };
  };
  parameters?: Record<string, any>;
}

export interface PASComponent {
  uid: string;
  name: string;
  displayName?: string;
  description?: string;
  type: string;
  autoDeploy?: boolean;
  projectName: string;
  namespaceName: string;
  createdAt: string;
  status?: string;
  workload?: Record<string, any>;
  componentWorkflow?: ComponentWorkflowConfig;
}

export interface ComponentWorkflowRun {
  name: string;
  uuid?: string;
  componentName: string;
  projectName: string;
  namespaceName: string;
  status?: string;
  commit?: string;
  image?: string;
  workflow?: ComponentWorkflowConfig;
  createdAt: string;
}

export interface ReleaseBinding {
  name: string;
  componentName: string;
  projectName: string;
  namespaceName: string;
  environment: string;
  releaseName?: string;
  status?: string;
  createdAt: string;
}

export interface EnvironmentReleaseResource {
  id: string;
  kind: string;
  name: string;
  namespace: string;
  healthStatus?: string;
  object?: {
    spec?: {
      hostnames?: string[];
      ports?: Array<{ name?: string; port: number; protocol?: string; targetPort?: number }>;
      rules?: Array<{
        backendRefs?: Array<{ name: string; port: number }>;
        matches?: Array<{ path?: { type: string; value: string } }>;
      }>;
      [key: string]: any;
    };
    [key: string]: any;
  };
  status?: Record<string, any>;
}

export interface EnvironmentRelease {
  spec: {
    owner: { projectName: string; componentName: string };
    environmentName: string;
    resources: EnvironmentReleaseResource[];
    targetPlane: string;
  };
  status?: {
    resources: Array<{
      id: string;
      kind: string;
      name: string;
      namespace: string;
      healthStatus?: string;
      [key: string]: any;
    }>;
  };
}

export interface CreateProjectRequest {
  name: string;
  displayName?: string;
  description?: string;
  deploymentPipeline?: string;
}

export interface CreateComponentRequest {
  name: string;
  displayName?: string;
  description?: string;
  componentType: string;
  autoDeploy?: boolean;
  workflow?: {
    name: string;
    systemParameters: {
      repository: {
        url: string;
        revision: { branch: string; commit?: string };
        appPath: string;
      };
    };
  };
}

export type SelectedItem =
  | { type: 'org' }
  | { type: 'project'; projectName: string }
  | { type: 'component'; projectName: string; componentName: string };
