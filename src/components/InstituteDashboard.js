import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function InstituteDashboard({ institute }) {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Institute Dashboard</h1>
        <p>Welcome, {institute.name}</p>
        <div className="institute-info">
          <span>Institute ID: {institute.id}</span>
          <span>Email: {institute.email}</span>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="menu-grid">
          <div className="menu-card" onClick={() => navigate('/create-test')}>
            <div className="menu-icon">📝</div>
            <h3>Create Test</h3>
            <p>Design and configure a new CET exam</p>
          </div>

          <div className="menu-card" onClick={() => navigate('/manage-slots')}>
            <div className="menu-icon">📅</div>
            <h3>Manage Exam Slots</h3>
            <p>Schedule and manage exam time slots</p>
          </div>

          <div className="menu-card" onClick={() => navigate('/test-list')}>
            <div className="menu-icon">📋</div>
            <h3>View Tests</h3>
            <p>View all created tests and their details</p>
          </div>

          <div className="menu-card" onClick={() => navigate('/analytics')}>
            <div className="menu-icon">📊</div>
            <h3>Analytics</h3>
            <p>View student performance and results</p>
          </div>
        </div>

        <div className="student-info">
          <h2>Recent Tests Created</h2>
          {tests.length === 0 ? (
            <p>No tests created yet. <button className="link-btn" onClick={() => navigate('/create-test')}>Create your first test</button></p>
          ) : (
            <ul>
              {tests.map((test, index) => (
                <li key={index}>{test.name}</li>
              ))}
            </ul>
          )}
        </div>

        <button className="logout-btn" onClick={() => window.location.href = '/'}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default InstituteDashboard;
