import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ProjectPage from './pages/ProjectPage';
import ComponentDetailPage from './pages/ComponentDetailPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/project/:orgName/:projectName" element={<ProjectPage />} />
          <Route path="/component/:orgName/:projectName/:componentName" element={<ComponentDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

