import React from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, Alert, CircularProgress } from '@wso2/oxygen-ui';
import { Rocket, Play, GitBranch, Globe, Code, Clock, Layers } from '@wso2/oxygen-ui-icons-react';
import { formatIST } from '../../utils/time';
import type {
  PASNamespace,
  PASProject,
  PASComponent,
  ComponentWorkflowRun,
  SelectedItem,
} from '../../types/api';

interface DetailPanelProps {
  org: PASNamespace | null;
  projects: PASProject[];
  selectedItem: SelectedItem | null;
  selectedComponent: PASComponent | null;
  componentsByProject: Record<string, PASComponent[]>;
  workflowRuns: ComponentWorkflowRun[];
  loadingRuns: boolean;
  actionInProgress: { type: 'build' | 'deploy'; key: string } | null;
  onBuild: (projectName: string, componentName: string) => void;
  onDeploy: (projectName: string, componentName: string) => void;
}

const STATUS_COLOR_MAP: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  Ready: 'success',
  Active: 'success',
  Succeeded: 'success',
  Building: 'warning',
  Running: 'warning',
  Failed: 'error',
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

function ComponentDetail({
  component,
  projectName,
  workflowRuns,
  loadingRuns,
  actionInProgress,
  onBuild,
  onDeploy,
}: {
  component: PASComponent;
  projectName: string;
  workflowRuns: ComponentWorkflowRun[];
  loadingRuns: boolean;
  actionInProgress: { type: 'build' | 'deploy'; key: string } | null;
  onBuild: () => void;
  onDeploy: () => void;
}) {
  const compKey = `${projectName}/${component.name}`;
  const isBuildInProgress = actionInProgress?.type === 'build' && actionInProgress.key === compKey;
  const isDeployInProgress = actionInProgress?.type === 'deploy' && actionInProgress.key === compKey;

  const repo = component.componentWorkflow?.systemParameters?.repository;

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
              {isDeployInProgress ? 'Deploying...' : 'Deploy (Simulated)'}
            </Button>
          </Box>

          {isBuildInProgress && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Build triggered! Compiling and creating container image...
            </Alert>
          )}
          {isDeployInProgress && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Deploy triggered! Rolling out to data plane cluster... (Simulated)
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Build History Card (from workflowRuns) */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Workflow Runs
          </Typography>
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
              {/* Header */}
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
              {/* Rows */}
              {workflowRuns.map((run: ComponentWorkflowRun) => {
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
  actionInProgress,
  onBuild,
  onDeploy,
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
        actionInProgress={actionInProgress}
        onBuild={() => onBuild(selectedItem.projectName, selectedItem.componentName)}
        onDeploy={() => onDeploy(selectedItem.projectName, selectedItem.componentName)}
      />
    );
  }

  return <EmptyState />;
}
