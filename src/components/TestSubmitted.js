import React from 'react';
import { useNavigate } from 'react-router-dom';

function TestSubmitted({ student }) {
  const navigate = useNavigate();
  const referenceId = Math.random().toString(36).substr(2, 9).toUpperCase();
  const submissionTime = new Date().toLocaleString();

  const handleBackToLogin = () => {
    navigate('/');
  };

  return (
    <div className="submitted-container">
      <div className="submitted-box">
        <div className="checkmark">✓</div>
        <h1>Test Submitted Successfully!</h1>
        <p>Dear {student.name}, your test has been submitted successfully.</p>

        <div className="reference-id">Reference ID: {referenceId}</div>

        <div style={{ textAlign: 'left', margin: '20px 0', fontSize: '14px', color: '#666' }}>
          <p>
            <strong>Submission Time:</strong> {submissionTime}
          </p>
          <p>
            <strong>Student ID:</strong> {student.id}
          </p>
          <p style={{ marginTop: '10px', fontSize: '13px', color: '#999' }}>
            You will receive your test results via email within 3-5 business days.
          </p>
        </div>

        <button className="login-again-btn" onClick={handleBackToLogin}>
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default TestSubmitted;
