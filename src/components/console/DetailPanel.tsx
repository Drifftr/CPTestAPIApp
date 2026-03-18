import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, Alert, CircularProgress, IconButton, Link } from '@wso2/oxygen-ui';
import { Rocket, Play, GitBranch, Globe, Code, Clock, Layers, RefreshCw, ChevronRight, ChevronDown } from '@wso2/oxygen-ui-icons-react';
import { formatIST } from '../../utils/time';
import type {
  PASNamespace,
  PASProject,
  PASComponent,
  WorkflowRun,
  ReleaseBinding,
  ReleaseResourceTree,
  SelectedItem,
} from '../../types/api';

interface DetailPanelProps {
  org: PASNamespace | null;
  projects: PASProject[];
  selectedItem: SelectedItem | null;
  selectedComponent: PASComponent | null;
  componentsByProject: Record<string, PASComponent[]>;
  workflowRuns: WorkflowRun[];
  loadingRuns: boolean;
  releaseBindings: ReleaseBinding[];
  envReleases: Record<string, ReleaseResourceTree>;
  loadingDeployments: boolean;
  actionInProgress: { type: 'build' | 'deploy'; key: string } | null;
  onBuild: (projectName: string, componentName: string) => void;
  onDeploy: (projectName: string, componentName: string) => void;
  onRefreshRuns?: () => void;
  onRefreshDeployments?: () => void;
}

const STATUS_COLOR_MAP: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  Ready: 'success',
  Active: 'success',
  Succeeded: 'success',
  Deployed: 'success',
  Building: 'warning',
  Running: 'warning',
  NotReady: 'warning',
  Progressing: 'warning',
  Failed: 'error',
  Degraded: 'error',
  Pending: 'info',
};

const BUILD_STATUS_SYMBOL: Record<string, string> = {
  Succeeded: '\u25CF',
  Failed: '\u25CF',
  Running: '\u25CB',
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

function EmptyState() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Box sx={{ textAlign: 'center' }}>
        <Layers size={48} style={{ opacity: 0.3 }} />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Select a resource from the tree to view details
        </Typography>
      </Box>
    </Box>
  );
}

function OrgDetail({ org, projectCount }: { org: PASNamespace; projectCount: number }) {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        {org.displayName ?? org.name}
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <InfoRow icon={<Globe size={18} />} label="Name" value={org.name} />
            {org.description && (
              <InfoRow icon={<Code size={18} />} label="Description" value={org.description} />
            )}
            <InfoRow icon={<Layers size={18} />} label="Projects" value={`${projectCount} project(s)`} />
            {org.createdAt && (
              <InfoRow icon={<Clock size={18} />} label="Created" value={formatIST(org.createdAt)} />
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function ProjectDetail({ project }: { project: PASProject }) {
  const componentCount = 0; // we don't have the count readily; will show from tree
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
        {project.displayName ?? project.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {project.name}
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {project.description && (
              <InfoRow icon={<Code size={18} />} label="Description" value={project.description} />
            )}
            <InfoRow icon={<Rocket size={18} />} label="Pipeline" value={project.deploymentPipeline ?? '—'} />
            <InfoRow icon={<Clock size={18} />} label="Created" value={formatIST(project.createdAt)} />
            {project.status && (
              <InfoRow icon={<Layers size={18} />} label="Status" value={project.status} />
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function DeploymentRow({ rb, image, envRelease }: {
  rb: ReleaseBinding;
  image?: string;
  envRelease?: ReleaseResourceTree;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = rb.status ?? 'Unknown';
  const nodes = envRelease?.nodes ?? [];
  const httpRoute = nodes.find(r => r.kind === 'HTTPRoute');
  const hostnames = httpRoute?.object?.spec?.hostnames ?? [];
  const svcResource = nodes.find(r => r.kind === 'Service');
  const svcPorts = svcResource?.object?.spec?.ports ?? [];
  const hasDetails = hostnames.length > 0 || svcPorts.length > 0 || nodes.length > 0;

  return (
    <Box>
      <Box
        onClick={hasDetails ? () => setExpanded(prev => !prev) : undefined}
        sx={{
          display: 'grid',
          gridTemplateColumns: '20px 100px 1fr 90px 140px',
          gap: 1,
          px: 1,
          py: 0.75,
          '&:hover': { bgcolor: 'action.hover' },
          borderRadius: 0.5,
          cursor: hasDetails ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {hasDetails ? (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <Box sx={{ width: 14 }} />
          )}
        </Box>
        <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 500 }}>
          {rb.environment}
        </Typography>
        <Typography
          variant="body2"
          title={image ?? ''}
          sx={{ fontFamily: 'monospace', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: image ? 'text.primary' : 'text.disabled' }}
        >
          {image ?? '—'}
        </Typography>
        <Chip
          label={status}
          color={STATUS_COLOR_MAP[status] ?? 'info'}
          size="small"
          sx={{ height: 20, fontSize: 11 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Clock size={12} style={{ opacity: 0.5 }} />
          <Typography variant="body2" sx={{ fontSize: 12 }}>
            {formatIST(rb.createdAt)}
          </Typography>
        </Box>
      </Box>
      {expanded && (
        <Box sx={{ ml: 3.5, mb: 1.5, mt: 0.5, pl: 1.5, borderLeft: 2, borderColor: 'divider' }}>
          {hostnames.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                Endpoints
              </Typography>
              {hostnames.map((hostname: string) => {
                const url = `http://${hostname}:29080`;
                return (
                  <Box key={hostname} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                    <Globe size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                    <Link
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontFamily: 'monospace', fontSize: 11 }}
                    >
                      {url}
                    </Link>
                  </Box>
                );
              })}
            </>
          )}
          {svcPorts.length > 0 && (
            <Box sx={{ mt: hostnames.length > 0 ? 0.5 : 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>
                Ports
              </Typography>
              {svcPorts.map((p: { name?: string; port: number; protocol?: string; targetPort?: number }) => (
                <Box key={p.port} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <Layers size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ fontSize: 11, color: 'text.secondary' }}>
                    {p.name ?? 'port'}: {p.port}{p.targetPort && p.targetPort !== p.port ? ` \u2192 ${p.targetPort}` : ''} ({p.protocol ?? 'TCP'})
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
          {nodes.length > 0 && (
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>
                Resources
              </Typography>
              {nodes.map((r) => (
                <Box key={r.uid ?? `${r.kind}/${r.name}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <Typography
                    component="span"
                    sx={{
                      color: r.health?.status === 'Healthy' ? 'success.main' : r.health?.status === 'Degraded' ? 'error.main' : 'warning.main',
                      fontSize: 8,
                    }}
                  >
                    {'\u25CF'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: 11 }}>
                    {r.kind}/{r.name}
                  </Typography>
                  <Chip
                    label={r.health?.status ?? 'Unknown'}
                    color={STATUS_COLOR_MAP[r.health?.status ?? ''] ?? 'info'}
                    size="small"
                    sx={{ height: 16, fontSize: 10 }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

function ComponentDetail({
  component,
  projectName,
  workflowRuns,
  loadingRuns,
  releaseBindings,
  envReleases,
  loadingDeployments,
  actionInProgress,
  onBuild,
  onDeploy,
  onRefreshRuns,
  onRefreshDeployments,
}: {
  component: PASComponent;
  projectName: string;
  workflowRuns: WorkflowRun[];
  loadingRuns: boolean;
  releaseBindings: ReleaseBinding[];
  envReleases: Record<string, ReleaseResourceTree>;
  loadingDeployments: boolean;
  actionInProgress: { type: 'build' | 'deploy'; key: string } | null;
  onBuild: () => void;
  onDeploy: () => void;
  onRefreshRuns?: () => void;
  onRefreshDeployments?: () => void;
}) {
  const compKey = `${projectName}/${component.name}`;
  const isBuildInProgress = actionInProgress?.type === 'build' && actionInProgress.key === compKey;
  const isDeployInProgress = actionInProgress?.type === 'deploy' && actionInProgress.key === compKey;

  const repo = component.workflow?.systemParameters?.repository;

  // Build a map: for each release binding, find the image from the last completed
  // workflow run created at or before the binding's createdAt
  const TERMINAL_SUCCESS = new Set(['Completed', 'Succeeded']);
  const completedRuns = [...workflowRuns]
    .filter(r => TERMINAL_SUCCESS.has(r.status ?? '') && r.image)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const resolveImage = (bindingCreatedAt: string): string | undefined => {
    const bindingTime = new Date(bindingCreatedAt).getTime();
    return completedRuns.find(r => new Date(r.createdAt).getTime() <= bindingTime)?.image;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {component.displayName ?? component.name}
        </Typography>
        <Chip
          label={component.status ?? 'Unknown'}
          color={STATUS_COLOR_MAP[component.status ?? ''] ?? 'info'}
          size="small"
        />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {projectName} / {component.name}
      </Typography>

      {/* Details Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Component Details
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <InfoRow icon={<Code size={18} />} label="Type" value={component.type} />
            <InfoRow
              icon={<GitBranch size={18} />}
              label="Branch"
              value={repo?.revision?.branch ?? '—'}
            />
            <InfoRow
              icon={<Layers size={18} />}
              label="Auto-deploy"
              value={component.autoDeploy ? 'Yes' : 'No'}
            />
            <InfoRow
              icon={<Clock size={18} />}
              label="Created"
              value={formatIST(component.createdAt)}
            />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <InfoRow icon={<Globe size={18} />} label="Repository" value={repo?.url ?? '—'} />
            </Box>
            {repo?.appPath && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <InfoRow icon={<Code size={18} />} label="App Path" value={repo.appPath} />
              </Box>
            )}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              startIcon={isBuildInProgress ? <CircularProgress size={16} color="inherit" /> : <Play size={16} />}
              onClick={onBuild}
              disabled={!!actionInProgress}
            >
              {isBuildInProgress ? 'Building...' : 'Build'}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={isDeployInProgress ? <CircularProgress size={16} color="inherit" /> : <Rocket size={16} />}
              onClick={onDeploy}
              disabled={!!actionInProgress}
            >
              {isDeployInProgress ? 'Deploying...' : 'Deploy'}
            </Button>
          </Box>

          {isBuildInProgress && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Build triggered! Compiling and creating container image...
            </Alert>
          )}
          {isDeployInProgress && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Deploy triggered! Rolling out to data plane cluster...
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Build History Card (from workflowRuns) */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Workflow Runs
            </Typography>
            <IconButton size="small" onClick={onRefreshRuns} disabled={loadingRuns}>
              <RefreshCw size={16} />
            </IconButton>
          </Box>
          {loadingRuns ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : workflowRuns.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No workflow runs yet
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {/* Header (runs are sorted latest-first below) */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 90px 120px 140px',
                  gap: 1,
                  px: 1,
                  py: 0.75,
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Run
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Status
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Commit
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Time
                </Typography>
              </Box>
              {/* Rows — sorted latest to oldest */}
              {[...workflowRuns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((run: WorkflowRun) => {
                const status = run.status ?? 'Unknown';
                return (
                  <Box
                    key={run.name}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 90px 120px 140px',
                      gap: 1,
                      px: 1,
                      py: 0.75,
                      '&:hover': { bgcolor: 'action.hover' },
                      borderRadius: 0.5,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {run.name.split('-').pop() || run.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        component="span"
                        sx={{
                          color:
                            status === 'Succeeded' ? 'success.main'
                            : status === 'Failed' ? 'error.main'
                            : 'warning.main',
                          fontSize: 10,
                        }}
                      >
                        {BUILD_STATUS_SYMBOL[status] ?? '\u25CF'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: 12 }}>
                        {status}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {run.commit ? run.commit.substring(0, 7) : '—'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Clock size={12} style={{ opacity: 0.5 }} />
                      <Typography variant="body2" sx={{ fontSize: 12 }}>
                        {formatIST(run.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Deployments Card */}
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Deployments
            </Typography>
            <IconButton size="small" onClick={onRefreshDeployments} disabled={loadingDeployments}>
              <RefreshCw size={16} />
            </IconButton>
          </Box>
          {loadingDeployments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : releaseBindings.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No deployments yet
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '20px 100px 1fr 90px 140px',
                  gap: 1,
                  px: 1,
                  py: 0.75,
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Box />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Environment
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Image
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Status
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Created
                </Typography>
              </Box>
              {[...releaseBindings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((rb: ReleaseBinding) => (
                <DeploymentRow
                  key={rb.name}
                  rb={rb}
                  image={resolveImage(rb.createdAt)}
                  envRelease={envReleases[rb.environment]}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default function DetailPanel({
  org,
  projects,
  selectedItem,
  selectedComponent,
  componentsByProject,
  workflowRuns,
  loadingRuns,
  releaseBindings,
  envReleases,
  loadingDeployments,
  actionInProgress,
  onBuild,
  onDeploy,
  onRefreshRuns,
  onRefreshDeployments,
}: DetailPanelProps) {
  if (!selectedItem) return <EmptyState />;

  if (selectedItem.type === 'org') {
    if (!org) return <EmptyState />;
    return <OrgDetail org={org} projectCount={projects.length} />;
  }

  if (selectedItem.type === 'project') {
    const project = projects.find(p => p.name === selectedItem.projectName);
    if (!project) return <EmptyState />;
    return <ProjectDetail project={project} />;
  }

  if (selectedItem.type === 'component') {
    if (!selectedComponent) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    return (
      <ComponentDetail
        component={selectedComponent}
        projectName={selectedItem.projectName}
        workflowRuns={workflowRuns}
        loadingRuns={loadingRuns}
        releaseBindings={releaseBindings}
        envReleases={envReleases}
        loadingDeployments={loadingDeployments}
        actionInProgress={actionInProgress}
        onBuild={() => onBuild(selectedItem.projectName, selectedItem.componentName)}
        onDeploy={() => onDeploy(selectedItem.projectName, selectedItem.componentName)}
        onRefreshRuns={onRefreshRuns}
        onRefreshDeployments={onRefreshDeployments}
      />
    );
  }

  return <EmptyState />;
}
