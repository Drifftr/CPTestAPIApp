import React, { useState } from 'react';
import { projectsAPI } from '../services/api';
import './CreateProjectModal.css';

function CreateProjectModal({ orgName, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    deploymentPipeline: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Only include fields that have values
      const payload = {};
      if (formData.name) payload.name = formData.name;
      if (formData.displayName) payload.displayName = formData.displayName;
      if (formData.description) payload.description = formData.description;
      if (formData.deploymentPipeline) payload.deploymentPipeline = formData.deploymentPipeline;

      await projectsAPI.create(orgName, payload);
      onSuccess();
    } catch (err) {
      setError(err.message);
      console.error('Failed to create project:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="deploymentPipeline">Deployment Pipeline</label>
            <input
              type="text"
              id="deploymentPipeline"
              name="deploymentPipeline"
              value={formData.deploymentPipeline}
              onChange={handleChange}
            />
          </div>

          {error && (
            <div className="form-error">Error: {error}</div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;

