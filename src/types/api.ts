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
