import React, { useState, useEffect } from 'react';
import { organizationsAPI } from '../services/api';
import './OrganizationSelector.css';

function OrganizationSelector({ selectedOrg, onOrgChange }) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const orgs = await organizationsAPI.list();
      setOrganizations(orgs);
      if (orgs.length > 0 && !selectedOrg) {
        onOrgChange(orgs[0].name);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to load organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    onOrgChange(e.target.value);
  };

  if (loading) {
    return <div className="org-selector-loading">Loading organizations...</div>;
  }

  if (error) {
    return <div className="org-selector-error">Error: {error}</div>;
  }

  return (
    <div className="org-selector">
      <label htmlFor="org-select">Organization: </label>
      <select
        id="org-select"
        value={selectedOrg || ''}
        onChange={handleChange}
        className="org-select-dropdown"
      >
        {organizations.map((org) => (
          <option key={org.name} value={org.name}>
            {org.displayName || org.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default OrganizationSelector;

