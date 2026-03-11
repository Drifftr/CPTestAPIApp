import React, { useState } from 'react';
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
} from '@wso2/oxygen-ui';
import { X } from '@wso2/oxygen-ui-icons-react';
import type { CreateProjectRequest } from '../../types/api';

interface CreateProjectDialogProps {
  open: boolean;
  orgName: string;
  onClose: () => void;
  onSubmit: (data: CreateProjectRequest) => Promise<void>;
}

export default function CreateProjectDialog({ open, orgName, onClose, onSubmit }: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [deploymentPipeline, setDeploymentPipeline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        displayName: displayName.trim() || undefined,
        description: description.trim() || undefined,
        deploymentPipeline: deploymentPipeline.trim() || undefined,
      });
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDisplayName('');
    setDescription('');
    setDeploymentPipeline('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Create Project in "{orgName}"
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
            placeholder="my-project"
            helperText="Lowercase alphanumeric with hyphens"
            disabled={loading}
          />
          <TextField
            label="Display Name"
            fullWidth
            value={displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
            placeholder="My Project"
            disabled={loading}
          />
          <TextField
            label="Description"
            multiline
            rows={3}
            fullWidth
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="A brief description of the project"
            disabled={loading}
          />
          <TextField
            label="Deployment Pipeline"
            fullWidth
            value={deploymentPipeline}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeploymentPipeline(e.target.value)}
            placeholder="default-pipeline"
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
          {loading ? 'Creating...' : 'Create Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
