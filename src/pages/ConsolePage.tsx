import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@wso2/oxygen-ui';
import ResourceTree from '../components/console/ResourceTree';
import DetailPanel from '../components/console/DetailPanel';
import CreateProjectDialog from '../components/console/CreateProjectDialog';
import CreateComponentDialog from '../components/console/CreateComponentDialog';
import useAuth from '../auth/useAuth';
import { decodeJwtPayload } from '../utils/jwt';
import {
  consoleProjectsAPI,
  consoleComponentsAPI,
  workflowRunsAPI,
  releaseBindingsAPI,
} from '../services/api';
import type {
  PASNamespace,
  PASProject,
  PASComponent,
  WorkflowRun,
  ReleaseBinding,
  ReleaseResourceTree,
  SelectedItem,
  CreateProjectRequest,
  CreateComponentRequest,
} from '../types/api';

async function resolveOrg(auth: any): Promise<PASNamespace> {
  let ouHandle: string | undefined;
  let ouName: string | undefined;

  // 1. Try ID token claims
  try {
    const idToken = await auth.getDecodedIDToken();
    ouHandle = idToken?.ouHandle;
    ouName = idToken?.ouName;
  } catch {}

  // 2. Fallback: decode access token (ID token may not have org claims)
  if (!ouHandle) {
    try {
      const accessToken = await auth.getAccessToken();
      const payload = decodeJwtPayload(accessToken);
      ouHandle = payload?.ouHandle;
      ouName = ouName || payload?.ouName;
    } catch {}
  }

  // Synthesize org from JWT claims (no /orgs API call needed —
  // PAS resolves namespace from JWT token on each request)
  const name = ouHandle || ouName || 'default';
  const displayName = ouName || ouHandle || 'Default Organization';
  return { name, displayName };
}

export default function ConsolePage() {
  const auth = useAuth();

  const [org, setOrg] = useState<PASNamespace | null>(null);
  const [projects, setProjects] = useState<PASProject[]>([]);
  const [componentsByProject, setComponentsByProject] = useState<Record<string, PASComponent[]>>({});
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<PASComponent | null>(null);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [releaseBindings, setReleaseBindings] = useState<ReleaseBinding[]>([]);
  const [envReleases, setEnvReleases] = useState<Record<string, ReleaseResourceTree>>({});
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => new Set(['org:default']));
  const [actionInProgress, setActionInProgress] = useState<{ type: 'build' | 'deploy'; key: string } | null>(null);
  const selectedComponentRef = useRef<PASComponent | null>(null);

  // Per-key loading/error tracking
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [errorsByKey, setErrorsByKey] = useState<Record<string, string>>({});

  const startLoading = (key: string) => setLoadingKeys(prev => new Set(prev).add(key));
  const stopLoading = (key: string) => setLoadingKeys(prev => { const next = new Set(prev); next.delete(key); return next; });
  const isLoading = useCallback((key: string) => loadingKeys.has(key), [loadingKeys]);
  const setError = (key: string, msg: string) => setErrorsByKey(prev => ({ ...prev, [key]: msg }));
  const clearError = (key: string) => setErrorsByKey(prev => { const next = { ...prev }; delete next[key]; return next; });

  // Dialog state
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createComponentOpen, setCreateComponentOpen] = useState(false);
  const [createComponentProject, setCreateComponentProject] = useState('');

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number | null>(null);

  // Keep selectedComponentRef in sync
  useEffect(() => {
    selectedComponentRef.current = selectedComponent;
  }, [selectedComponent]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    pollStartRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // 1. Resolve org on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resolved = await resolveOrg(auth);
        if (!cancelled) {
          setOrg(resolved);
          setExpandedNodes(new Set([`org:${resolved.name}`]));
        }
      } catch (err: any) {
        console.error('Failed to resolve org:', err);
        if (!cancelled) setOrg({ name: 'default', displayName: 'Default Organization' });
      }
    })();
    return () => { cancelled = true; };
  }, [auth]);

  // 2. Load projects after org resolved
  useEffect(() => {
    if (!org) return;
    let cancelled = false;
    const key = 'projects';
    (async () => {
      startLoading(key);
      clearError(key);
      try {
        const items = await consoleProjectsAPI.list();
        if (!cancelled) setProjects(items);
      } catch (err: any) {
        console.error('Failed to load projects:', err);
        if (!cancelled) setError(key, err.message);
      } finally {
        if (!cancelled) stopLoading(key);
      }
    })();
    return () => { cancelled = true; };
  }, [org]);

  // Load components for a project (on expand)
  const loadComponents = useCallback(async (projectName: string) => {
    const key = `components:${projectName}`;
    if (componentsByProject[projectName]) return; // already loaded
    startLoading(key);
    clearError(key);
    try {
      const items = await consoleComponentsAPI.list(projectName);
      setComponentsByProject(prev => ({ ...prev, [projectName]: items }));
    } catch (err: any) {
      console.error(`Failed to load components for ${projectName}:`, err);
      setError(key, err.message);
    } finally {
      stopLoading(key);
    }
  }, [componentsByProject]);

  // Load component detail + workflow runs + release bindings + env releases
  const loadComponentDetail = useCallback(async (projectName: string, componentName: string) => {
    const runsKey = `runs:${projectName}/${componentName}`;
    const deploymentsKey = `deployments:${projectName}/${componentName}`;
    startLoading(runsKey);
    startLoading(deploymentsKey);
    clearError(runsKey);
    try {
      const [detail, runs, bindings] = await Promise.all([
        consoleComponentsAPI.get(projectName, componentName),
        workflowRunsAPI.list(projectName, componentName),
        releaseBindingsAPI.list(projectName, componentName),
      ]);
      setSelectedComponent(detail);
      setWorkflowRuns(runs);
      setReleaseBindings(bindings);
      // Fetch resource tree for each binding (best-effort)
      if (bindings.length > 0) {
        const envResults = await Promise.allSettled(
          bindings.map((b: ReleaseBinding) =>
            releaseBindingsAPI.getResourceTree(b.name)
              .then((data: ReleaseResourceTree) => [b.environment, data] as const)
          )
        );
        const envMap: Record<string, ReleaseResourceTree> = {};
        for (const r of envResults) {
          if (r.status === 'fulfilled') {
            envMap[r.value[0]] = r.value[1];
          }
        }
        setEnvReleases(envMap);
      } else {
        setEnvReleases({});
      }
    } catch (err: any) {
      console.error(`Failed to load component detail:`, err);
      setError(runsKey, err.message);
    } finally {
      stopLoading(runsKey);
      stopLoading(deploymentsKey);
    }
  }, []);

  const handleToggle = useCallback((nodeKey: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeKey)) {
        next.delete(nodeKey);
      } else {
        next.add(nodeKey);
        // If expanding a project node, load its components
        const projMatch = nodeKey.match(/^proj:(.+)$/);
        if (projMatch) {
          loadComponents(projMatch[1]);
        }
      }
      return next;
    });
  }, [loadComponents]);

  const handleSelect = useCallback((item: SelectedItem) => {
    stopPolling();
    setActionInProgress(null);
    setSelectedItem(item);
    if (item.type === 'org') {
      setSelectedComponent(null);
      setWorkflowRuns([]);
      setReleaseBindings([]);
      setEnvReleases({});
    } else if (item.type === 'project') {
      setSelectedComponent(null);
      setWorkflowRuns([]);
      setReleaseBindings([]);
      setEnvReleases({});
      setExpandedNodes(prev => {
        const next = new Set(prev);
        next.add(`proj:${item.projectName}`);
        return next;
      });
      loadComponents(item.projectName);
    } else if (item.type === 'component') {
      setExpandedNodes(prev => {
        const next = new Set(prev);
        next.add(`proj:${item.projectName}`);
        return next;
      });
      loadComponents(item.projectName);
      loadComponentDetail(item.projectName, item.componentName);
    }
  }, [loadComponents, loadComponentDetail, stopPolling]);

  const handleBuild = useCallback(async (projectName: string, componentName: string) => {
    const key = `${projectName}/${componentName}`;
    const comp = selectedComponentRef.current;
    if (!comp?.workflow) {
      setError(key, 'No workflow configured for this component');
      return;
    }
    setActionInProgress({ type: 'build', key });
    clearError(key);
    try {
      await workflowRunsAPI.create(projectName, componentName, {
        workflow: comp.workflow,
      });
      // Refresh component detail after successful create
      await loadComponentDetail(projectName, componentName);

      // Start polling for build status updates
      stopPolling();
      pollStartRef.current = Date.now();
      const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

      pollIntervalRef.current = setInterval(async () => {
        // Timeout safety: stop after 10 minutes
        if (pollStartRef.current && Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
          stopPolling();
          setActionInProgress(null);
          return;
        }
        try {
          await loadComponentDetail(projectName, componentName);
        } catch {
          // Polling fetch failed — don't crash, just skip this tick
        }
      }, 5000);
    } catch (err: any) {
      setError(key, err.message);
      setActionInProgress(null);
    }
  }, [loadComponentDetail, stopPolling]);

  // Stop polling when latest workflow run reaches a terminal status
  useEffect(() => {
    if (!pollIntervalRef.current || workflowRuns.length === 0) return;
    const NON_TERMINAL = new Set(['Pending', 'Running', 'InProgress', 'Unknown', 'Queued']);
    const latestStatus = workflowRuns[0]?.status;
    if (!latestStatus || !NON_TERMINAL.has(latestStatus)) {
      stopPolling();
      setActionInProgress(null);
    }
  }, [workflowRuns, stopPolling]);

  const handleRefreshRuns = useCallback(() => {
    if (selectedItem?.type === 'component') {
      loadComponentDetail(selectedItem.projectName, selectedItem.componentName);
    }
  }, [selectedItem, loadComponentDetail]);

  const handleRefreshDeployments = useCallback(async () => {
    if (selectedItem?.type !== 'component') return;
    const { projectName, componentName } = selectedItem;
    const deploymentsKey = `deployments:${projectName}/${componentName}`;
    startLoading(deploymentsKey);
    try {
      const bindings = await releaseBindingsAPI.list(projectName, componentName);
      setReleaseBindings(bindings);
      if (bindings.length > 0) {
        const envResults = await Promise.allSettled(
          bindings.map((b: ReleaseBinding) =>
            releaseBindingsAPI.getResourceTree(b.name)
              .then((data: ReleaseResourceTree) => [b.environment, data] as const)
          )
        );
        const envMap: Record<string, ReleaseResourceTree> = {};
        for (const r of envResults) {
          if (r.status === 'fulfilled') {
            envMap[r.value[0]] = r.value[1];
          }
        }
        setEnvReleases(envMap);
      } else {
        setEnvReleases({});
      }
    } catch (err: any) {
      console.error('Failed to refresh deployments:', err);
    } finally {
      stopLoading(deploymentsKey);
    }
  }, [selectedItem]);

  const handleDeploy = useCallback(async (projectName: string, componentName: string) => {
    const key = `${projectName}/${componentName}`;
    setActionInProgress({ type: 'deploy', key });
    clearError(key);
    try {
      await consoleComponentsAPI.generateRelease(componentName);
      await loadComponentDetail(projectName, componentName);
    } catch (err: any) {
      setError(key, err.message);
    } finally {
      setActionInProgress(null);
    }
  }, [clearError, loadComponentDetail, setError]);

  const handleCreateProject = useCallback(async (data: CreateProjectRequest) => {
    await consoleProjectsAPI.create(data);
    // Refresh project list
    const items = await consoleProjectsAPI.list();
    setProjects(items);
    setCreateProjectOpen(false);
    setSelectedItem({ type: 'project', projectName: data.name });
    setExpandedNodes(prev => new Set(prev).add(`proj:${data.name}`));
  }, []);

  const handleCreateComponent = useCallback(async (data: CreateComponentRequest) => {
    await consoleComponentsAPI.create(createComponentProject, data);
    // Refresh component list for that project
    const items = await consoleComponentsAPI.list(createComponentProject);
    setComponentsByProject(prev => ({ ...prev, [createComponentProject]: items }));
    setCreateComponentOpen(false);
    setSelectedItem({
      type: 'component',
      projectName: createComponentProject,
      componentName: data.name,
    });
  }, [createComponentProject]);

  // Initial loading state
  if (!org) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 52px)', bgcolor: 'background.default' }}>
      {/* Left panel: Resource Tree */}
      <Box sx={{ width: 300, flexShrink: 0 }}>
        <ResourceTree
          org={org}
          projects={projects}
          componentsByProject={componentsByProject}
          selectedItem={selectedItem}
          expandedNodes={expandedNodes}
          isLoading={isLoading}
          onSelect={handleSelect}
          onToggle={handleToggle}
          onCreateProject={() => setCreateProjectOpen(true)}
          onCreateComponent={(projectName) => {
            setCreateComponentProject(projectName);
            setCreateComponentOpen(true);
          }}
        />
      </Box>

      {/* Right panel: Detail */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {errorsByKey['projects'] && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load projects: {errorsByKey['projects']}
          </Alert>
        )}
        {selectedItem?.type === 'component' && errorsByKey[`${selectedItem.projectName}/${selectedItem.componentName}`] && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorsByKey[`${selectedItem.projectName}/${selectedItem.componentName}`]}
          </Alert>
        )}
        <DetailPanel
          org={org}
          projects={projects}
          selectedItem={selectedItem}
          selectedComponent={selectedComponent}
          componentsByProject={componentsByProject}
          workflowRuns={workflowRuns}
          loadingRuns={isLoading(
            selectedItem?.type === 'component'
              ? `runs:${selectedItem.projectName}/${selectedItem.componentName}`
              : ''
          )}
          releaseBindings={releaseBindings}
          envReleases={envReleases}
          loadingDeployments={isLoading(
            selectedItem?.type === 'component'
              ? `deployments:${selectedItem.projectName}/${selectedItem.componentName}`
              : ''
          )}
          actionInProgress={actionInProgress}
          onBuild={handleBuild}
          onDeploy={handleDeploy}
          onRefreshRuns={handleRefreshRuns}
          onRefreshDeployments={handleRefreshDeployments}
        />
      </Box>

      {/* Dialogs */}
      <CreateProjectDialog
        open={createProjectOpen}
        orgName={org.displayName ?? org.name}
        onClose={() => setCreateProjectOpen(false)}
        onSubmit={handleCreateProject}
      />
      <CreateComponentDialog
        open={createComponentOpen}
        projectName={createComponentProject}
        onClose={() => setCreateComponentOpen(false)}
        onSubmit={handleCreateComponent}
      />
    </Box>
  );
}
