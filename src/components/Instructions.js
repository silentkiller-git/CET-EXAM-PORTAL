import React from 'react';
import { useNavigate } from 'react-router-dom';
import { instructionsData, testData } from '../data/mockData';

function Instructions({ student }) {
  const navigate = useNavigate();

  const handleConfirm = () => {
    navigate('/test');
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="instructions-container">
      <div className="instructions-box">
        <h1>📋 Test Instructions</h1>

        <div className="instructions-section">
          <h3>Exam Overview</h3>
          <p>
            You are about to take the <strong>{testData.examName}</strong>. Please read the
            following instructions carefully before proceeding.
          </p>
        </div>

        <div className="instructions-section">
          <h3>General Instructions</h3>
          <ul>
            {instructionsData.general.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ul>
        </div>

        <div className="instructions-section">
          <h3>Important Rules</h3>
          <ul>
            {instructionsData.rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ul>
        </div>

        <div className="instructions-section">
          <h3>Navigation & Question Palette</h3>
          <ul>
            {instructionsData.navigation.map((nav, index) => (
              <li key={index}>{nav}</li>
            ))}
          </ul>
        </div>

        <div className="instructions-section">
          <h3>Marking Scheme</h3>
          <ul>
            {instructionsData.marking.map((mark, index) => (
              <li key={index}>{mark}</li>
            ))}
          </ul>
        </div>

        <div className="instructions-section">
          <h3>Confirmation</h3>
          <p style={{ color: '#d32f2f', fontWeight: '600' }}>
            ⚠️ Once you submit this test, it cannot be reattempted. Please ensure you are ready
            before clicking the Confirm button.
          </p>
        </div>

        <div className="instructions-footer">
          <button className="btn btn-secondary" onClick={handleCancel}>
            Back to Dashboard
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            Confirm & Begin Test
          </button>
        </div>
      </div>
    </div>
  );
}

export default Instructions;
