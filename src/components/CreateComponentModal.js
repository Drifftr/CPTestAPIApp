import React, { useState } from 'react';
import { componentsAPI } from '../services/api';
import './CreateComponentModal.css';

function CreateComponentModal({ orgName, projectName, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    type: '',
    workflowName: '',
    // Schema repository fields
    schemaRepositoryUrl: '',
    schemaRepositoryRevisionBranch: '',
    schemaRepositoryRevisionCommit: '',
    schemaRepositoryAppPath: '',
    schemaRepositorySecretRef: ''
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
      if (formData.type) payload.type = formData.type;
      
      // Construct workflow object if workflowName is provided
      if (formData.workflowName) {
        payload.workflow = {
          name: formData.workflowName
        };
        
        // Construct schema object with the nested repository structure
        const hasSchemaFields = formData.schemaRepositoryUrl || 
                                formData.schemaRepositoryRevisionBranch ||
                                formData.schemaRepositoryRevisionCommit ||
                                formData.schemaRepositoryAppPath ||
                                formData.schemaRepositorySecretRef;
        
        if (hasSchemaFields) {
          const schema = {
            repository: {}
          };
          
          if (formData.schemaRepositoryUrl) {
            schema.repository.url = formData.schemaRepositoryUrl;
          }
          
          if (formData.schemaRepositoryRevisionBranch || formData.schemaRepositoryRevisionCommit) {
            schema.repository.revision = {};
            if (formData.schemaRepositoryRevisionBranch) {
              schema.repository.revision.branch = formData.schemaRepositoryRevisionBranch;
            }
            if (formData.schemaRepositoryRevisionCommit !== undefined) {
              schema.repository.revision.commit = formData.schemaRepositoryRevisionCommit;
            }
          }
          
          if (formData.schemaRepositoryAppPath) {
            schema.repository.appPath = formData.schemaRepositoryAppPath;
          }
          
          if (formData.schemaRepositorySecretRef) {
            schema.repository.secretRef = formData.schemaRepositorySecretRef;
          }
          
          payload.workflow.schema = schema;
        }
      }

      await componentsAPI.create(orgName, projectName, payload);
      onSuccess();
    } catch (err) {
      setError(err.message);
      console.error('Failed to create component:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Component</h2>
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
            <label htmlFor="type">Type *</label>
            <input
              type="text"
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-section">
            <h3>Workflow (Optional)</h3>
            
            <div className="form-group">
              <label htmlFor="workflowName">Workflow Name</label>
              <input
                type="text"
                id="workflowName"
                name="workflowName"
                value={formData.workflowName}
                onChange={handleChange}
                placeholder="Enter workflow name"
              />
            </div>

            <div className="form-group">
              <label>Workflow Schema - Repository</label>
              
              <div className="schema-subsection">
                <h4>Repository</h4>
                
                <div className="form-group">
                  <label htmlFor="schemaRepositoryUrl">URL</label>
                  <input
                    type="text"
                    id="schemaRepositoryUrl"
                    name="schemaRepositoryUrl"
                    value={formData.schemaRepositoryUrl}
                    onChange={handleChange}
                    placeholder="https://github.com/drifftr/wso2cloud"
                  />
                </div>

                <div className="schema-subsection">
                  <h5>Revision</h5>
                  
                  <div className="form-group">
                    <label htmlFor="schemaRepositoryRevisionBranch">Branch</label>
                    <input
                      type="text"
                      id="schemaRepositoryRevisionBranch"
                      name="schemaRepositoryRevisionBranch"
                      value={formData.schemaRepositoryRevisionBranch}
                      onChange={handleChange}
                      placeholder="main"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="schemaRepositoryRevisionCommit">Commit</label>
                    <input
                      type="text"
                      id="schemaRepositoryRevisionCommit"
                      name="schemaRepositoryRevisionCommit"
                      value={formData.schemaRepositoryRevisionCommit}
                      onChange={handleChange}
                      placeholder=""
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="schemaRepositoryAppPath">App Path</label>
                  <input
                    type="text"
                    id="schemaRepositoryAppPath"
                    name="schemaRepositoryAppPath"
                    value={formData.schemaRepositoryAppPath}
                    onChange={handleChange}
                    placeholder="/backend"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="schemaRepositorySecretRef">Secret Ref</label>
                  <input
                    type="text"
                    id="schemaRepositorySecretRef"
                    name="schemaRepositorySecretRef"
                    value={formData.schemaRepositorySecretRef}
                    onChange={handleChange}
                    placeholder="github-pat"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="form-error">Error: {error}</div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Creating...' : 'Create Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateComponentModal;

