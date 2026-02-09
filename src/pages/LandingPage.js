import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizationSelector from '../components/OrganizationSelector';
import CreateProjectModal from '../components/CreateProjectModal';
import { projectsAPI } from '../services/api';
import './LandingPage.css';

function LandingPage() {
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedOrg) {
      loadProjects();
    }
  }, [selectedOrg]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectList = await projectsAPI.list(selectedOrg);
      setProjects(projectList);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (orgName) => {
    setSelectedOrg(orgName);
  };

  const handleProjectClick = (project) => {
    navigate(`/project/${selectedOrg}/${project.name}`);
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleProjectCreated = () => {
    setShowCreateModal(false);
    loadProjects();
  };

  return (
    <div className="landing-page">
      <OrganizationSelector selectedOrg={selectedOrg} onOrgChange={handleOrgChange} />
      
      <div className="landing-content">
        <div className="landing-header">
          <h1>Projects</h1>
          {selectedOrg && (
            <button className="create-button" onClick={handleCreateProject}>
              Create New Project
            </button>
          )}
        </div>

        {!selectedOrg && (
          <div className="empty-state">
            Please select an organization to view projects
          </div>
        )}

        {selectedOrg && loading && (
          <div className="loading-state">Loading projects...</div>
        )}

        {selectedOrg && error && (
          <div className="error-state">Error: {error}</div>
        )}

        {selectedOrg && !loading && !error && (
          <div className="projects-grid">
            {projects.length === 0 ? (
              <div className="empty-state">No projects found. Create your first project!</div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.uid || project.name}
                  className="project-tile"
                  onClick={() => handleProjectClick(project)}
                >
                  <h3>{project.displayName || project.name}</h3>
                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}
                  <div className="project-meta">
                    <span className="project-status">{project.status || 'N/A'}</span>
                    <span className="project-date">
                      {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateProjectModal
          orgName={selectedOrg}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleProjectCreated}
        />
      )}
    </div>
  );
}

export default LandingPage;

