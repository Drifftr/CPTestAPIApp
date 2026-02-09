import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrganizationSelector from '../components/OrganizationSelector';
import CreateComponentModal from '../components/CreateComponentModal';
import { componentsAPI } from '../services/api';
import './ProjectPage.css';

function ProjectPage() {
  const { orgName, projectName } = useParams();
  const navigate = useNavigate();
  const [selectedOrg, setSelectedOrg] = useState(orgName);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (selectedOrg && projectName) {
      loadComponents();
    }
  }, [selectedOrg, projectName]);

  const loadComponents = async () => {
    try {
      setLoading(true);
      setError(null);
      const componentList = await componentsAPI.list(selectedOrg, projectName);
      setComponents(componentList);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load components:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (newOrgName) => {
    setSelectedOrg(newOrgName);
    // Navigate back to landing page when org changes
    navigate('/');
  };

  const handleComponentClick = (component) => {
    navigate(`/component/${selectedOrg}/${projectName}/${component.name}`);
  };

  const handleCreateComponent = () => {
    setShowCreateModal(true);
  };

  const handleComponentCreated = () => {
    setShowCreateModal(false);
    loadComponents();
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="project-page">
      <OrganizationSelector selectedOrg={selectedOrg} onOrgChange={handleOrgChange} />
      
      <div className="project-content">
        <div className="project-header">
          <div>
            <button className="back-button" onClick={handleBack}>← Back</button>
            <h1>Project: {projectName}</h1>
          </div>
          <button className="create-button" onClick={handleCreateComponent}>
            Create New Component
          </button>
        </div>

        {loading && (
          <div className="loading-state">Loading components...</div>
        )}

        {error && (
          <div className="error-state">Error: {error}</div>
        )}

        {!loading && !error && (
          <div className="components-grid">
            {components.length === 0 ? (
              <div className="empty-state">No components found. Create your first component!</div>
            ) : (
              components.map((component) => (
                <div
                  key={component.uid || component.name}
                  className="component-tile"
                  onClick={() => handleComponentClick(component)}
                >
                  <h3>{component.displayName || component.name}</h3>
                  {component.description && (
                    <p className="component-description">{component.description}</p>
                  )}
                  <div className="component-meta">
                    <span className="component-type">{component.type || 'N/A'}</span>
                    <span className="component-status">{component.status || 'N/A'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateComponentModal
          orgName={selectedOrg}
          projectName={projectName}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleComponentCreated}
        />
      )}
    </div>
  );
}

export default ProjectPage;

