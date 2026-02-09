import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrganizationSelector from '../components/OrganizationSelector';
import { componentsAPI } from '../services/api';
import './ComponentDetailPage.css';

function ComponentDetailPage() {
  const { orgName, projectName, componentName } = useParams();
  const navigate = useNavigate();
  const [selectedOrg, setSelectedOrg] = useState(orgName);
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedOrg && projectName && componentName) {
      loadComponent();
    }
  }, [selectedOrg, projectName, componentName]);

  const loadComponent = async () => {
    try {
      setLoading(true);
      setError(null);
      const componentData = await componentsAPI.get(selectedOrg, projectName, componentName);
      setComponent(componentData);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load component:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (newOrgName) => {
    setSelectedOrg(newOrgName);
    // Navigate back to landing page when org changes
    navigate('/');
  };

  const handleBack = () => {
    navigate(`/project/${selectedOrg}/${projectName}`);
  };

  const formatValue = (value) => {
    if (value === null) {
      return <span className="null-value">null</span>;
    }
    if (value === undefined) {
      return <span className="undefined-value">undefined</span>;
    }
    if (typeof value === 'boolean') {
      return <span className="boolean-value">{String(value)}</span>;
    }
    if (typeof value === 'number') {
      return <span className="number-value">{value}</span>;
    }
    if (Array.isArray(value)) {
      return (
        <div className="array-value">
          [
          {value.map((item, index) => (
            <div key={index} className="array-item">
              {formatValue(item)}
              {index < value.length - 1 && ','}
            </div>
          ))}
          ]
        </div>
      );
    }
    return <span className="string-value">{String(value)}</span>;
  };

  const renderObject = (obj, level = 0, parentKey = '') => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return formatValue(obj);
    }

    return (
      <div className={`detail-object level-${level}`}>
        {Object.entries(obj).map(([key, value]) => {
          const isNestedObject = typeof value === 'object' && value !== null && !Array.isArray(value);
          const fullKey = parentKey ? `${parentKey}.${key}` : key;
          
          return (
            <div key={key} className={`detail-field ${isNestedObject ? 'nested' : ''}`}>
              <div className="detail-key-wrapper">
                <span className="detail-key">{key}:</span>
                {!isNestedObject && <span className="detail-colon"> </span>}
              </div>
              {isNestedObject ? (
                <div className="nested-object-container">
                  {renderObject(value, level + 1, fullKey)}
                </div>
              ) : (
                <div className="detail-value-container">
                  {formatValue(value)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="component-detail-page">
      <OrganizationSelector selectedOrg={selectedOrg} onOrgChange={handleOrgChange} />
      
      <div className="component-detail-content">
        <div className="component-detail-header">
          <button className="back-button" onClick={handleBack}>← Back</button>
          <h1>Component: {componentName}</h1>
        </div>

        {loading && (
          <div className="loading-state">Loading component details...</div>
        )}

        {error && (
          <div className="error-state">Error: {error}</div>
        )}

        {!loading && !error && component && (
          <div className="component-details">
            <div className="details-section">
              <h2>Component Details</h2>
              <div className="component-data">
                {renderObject(component)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComponentDetailPage;

