import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
} from '@wso2/oxygen-ui';
import { X } from '@wso2/oxygen-ui-icons-react';
import type { CreateComponentRequest } from '../../types/api';
import { componentTypesAPI } from '../../services/api';

interface ComponentTypeOption {
  name: string;
  workloadType: string;
  value: string; // "{workloadType}/{name}"
}

interface CreateComponentDialogProps {
  open: boolean;
  projectName: string;
  onClose: () => void;
  onSubmit: (data: CreateComponentRequest) => Promise<void>;
}

const WORKFLOW_OPTIONS_BY_COMPONENT_TYPE: Record<string, Array<{ value: string; label: string }>> = {
  'deployment/service': [
    { value: 'gcp-buildpacks-builder', label: 'Google Cloud Buildpacks' },
    { value: 'paketo-buildpacks-builder', label: 'Paketo Buildpacks' },
    { value: 'ballerina-buildpack-builder', label: 'Ballerina Buildpack' },
    { value: 'dockerfile-builder', label: 'Dockerfile' },
  ],
  'deployment/worker': [
    { value: 'gcp-buildpacks-builder', label: 'Google Cloud Buildpacks' },
    { value: 'paketo-buildpacks-builder', label: 'Paketo Buildpacks' },
    { value: 'dockerfile-builder', label: 'Dockerfile' },
  ],
  'deployment/web-application': [
    { value: 'dockerfile-builder', label: 'Dockerfile' },
    { value: 'paketo-buildpacks-builder', label: 'Paketo Buildpacks' },
    { value: 'gcp-buildpacks-builder', label: 'Google Cloud Buildpacks' },
  ],
  'cronjob/scheduled-task': [
    { value: 'gcp-buildpacks-builder', label: 'Google Cloud Buildpacks' },
    { value: 'paketo-buildpacks-builder', label: 'Paketo Buildpacks' },
    { value: 'dockerfile-builder', label: 'Dockerfile' },
  ],
};

export default function CreateComponentDialog({ open, projectName, onClose, onSubmit }: CreateComponentDialogProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [componentTypeOptions, setComponentTypeOptions] = useState<ComponentTypeOption[]>([]);
  const [componentType, setComponentType] = useState('deployment/service');
  const [workflowName, setWorkflowName] = useState('gcp-buildpacks-builder');
  const [repository, setRepository] = useState('');
  const [branch, setBranch] = useState('main');
  const [appPath, setAppPath] = useState('/');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open) return;
    componentTypesAPI.list().then(types => {
      setComponentTypeOptions(types);
      if (types.length > 0 && !types.some(t => t.value === componentType)) {
        setComponentType(types[0].value);
      }
    }).catch(() => {});
  }, [open]);

  const workflowOptions = useMemo(
    () => WORKFLOW_OPTIONS_BY_COMPONENT_TYPE[componentType.trim()] || [],
    [componentType]
  );

  useEffect(() => {
    if (workflowOptions.length === 0) {
      setWorkflowName('');
      return;
    }
    if (!workflowOptions.some(option => option.value === workflowName)) {
      setWorkflowName(workflowOptions[0].value);
    }
  }, [workflowName, workflowOptions]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data: CreateComponentRequest = {
        name: name.trim(),
        displayName: displayName.trim() || undefined,
        description: description.trim() || undefined,
        componentType: { name: componentType.trim() },
      };
      if (repository.trim()) {
        if (!workflowName.trim()) {
          throw new Error('Select a valid workflow for the chosen component type');
        }
        data.workflow = {
          kind: 'ClusterWorkflow',
          name: workflowName.trim(),
          systemParameters: {
            repository: {
              url: repository.trim(),
              revision: { branch: branch.trim() || 'main' },
              appPath: appPath.trim() || '/',
            },
          },
        };
      }
      await onSubmit(data);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create component');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDisplayName('');
    setDescription('');
    setComponentType('deployment/service');
    setWorkflowName('gcp-buildpacks-builder');
    setRepository('');
    setBranch('main');
    setAppPath('/');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Create Component in "{projectName}"
        <IconButton size="small" onClick={handleClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Name"
            required
            fullWidth
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="my-service"
            helperText="Lowercase alphanumeric with hyphens"
            disabled={loading}
          />
          <TextField
            label="Display Name"
            fullWidth
            value={displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
            placeholder="My Service"
            disabled={loading}
          />
          <TextField
            label="Description"
            fullWidth
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            placeholder="Brief description"
            disabled={loading}
          />
          <TextField
            label="Component Type"
            select
            required
            fullWidth
            value={componentType}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComponentType(e.target.value)}
            helperText="Select the component type for this component"
            disabled={loading || componentTypeOptions.length === 0}
          >
            {componentTypeOptions.map((ct) => (
              <MenuItem key={ct.value} value={ct.value}>
                {ct.name} ({ct.workloadType})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Workflow Name"
            select
            fullWidth
            value={workflowName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkflowName(e.target.value)}
            helperText={
              workflowOptions.length > 0
                ? 'Allowed workflows for the selected component type'
                : 'No predefined workflows for this component type'
            }
            disabled={loading || workflowOptions.length === 0}
          >
            {workflowOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Repository URL"
            fullWidth
            value={repository}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepository(e.target.value)}
            placeholder="https://github.com/org/repo"
            disabled={loading}
          />
          <TextField
            label="Branch"
            fullWidth
            value={branch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBranch(e.target.value)}
            placeholder="main"
            disabled={loading}
          />
          <TextField
            label="App Path"
            fullWidth
            value={appPath}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAppPath(e.target.value)}
            placeholder="/"
            helperText="Path to application within the repository"
            disabled={loading}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {loading ? 'Creating...' : 'Create Component'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
