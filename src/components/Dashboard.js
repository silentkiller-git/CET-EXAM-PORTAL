import React from 'react';
import { useNavigate } from 'react-router-dom';
import { testData } from '../data/mockData';

function Dashboard({ student }) {
  const navigate = useNavigate();

  const handleStartTest = () => {
    navigate('/instructions');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome to CET Exam</h1>
        <p>Please review the test details below before starting</p>
      </div>

      <div className="dashboard-content">
        <div className="student-info">
          <h2>Student Information</h2>
          <div className="info-item">
            <span className="info-label">Student Name:</span>
            <span className="info-value">{student.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Student ID:</span>
            <span className="info-value">{student.id}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{student.email}</span>
          </div>
        </div>

        <div className="student-info">
          <h2>Exam Details</h2>
          <div className="info-item">
            <span className="info-label">Exam Name:</span>
            <span className="info-value">{testData.examName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Questions:</span>
            <span className="info-value">{testData.totalQuestions}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Exam Duration:</span>
            <span className="info-value">{testData.duration} minutes</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Marks:</span>
            <span className="info-value">{testData.totalQuestions}</span>
          </div>
        </div>

        <button className="start-test-btn" onClick={handleStartTest}>
          Start Test
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
