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
  kind?: string;
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
  workflow?: ComponentWorkflowConfig;
}

export interface WorkflowRun {
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
  state?: 'Active' | 'Undeploy';
  status?: string;
  createdAt: string;
}

export interface ResourceNode {
  kind: string;
  name: string;
  namespace?: string;
  uid?: string;
  health?: { status?: string; message?: string };
  object?: Record<string, any>;
  createdAt?: string;
}

export interface ReleaseResourceTree {
  name?: string;
  targetPlane?: string;
  nodes?: ResourceNode[];
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
  componentType: { kind?: string; name: string };
  autoDeploy?: boolean;
  workflow?: {
    kind?: string;
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
