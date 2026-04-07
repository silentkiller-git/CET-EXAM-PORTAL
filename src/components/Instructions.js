import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

function Instructions({ student }) {
  const navigate = useNavigate();
  const activeExam = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('cet_active_exam') || localStorage.getItem('cet_active_exam');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const instructionsData = {
    general: [
      'Ensure a stable internet connection throughout the exam.',
      'The timer is server-controlled and cannot be paused.',
      'Your answers are auto-saved as you select options.',
    ],
    rules: [
      'Do not refresh or close the browser tab during the exam.',
      'Once submitted, re-attempt is not allowed.',
      'Submitting after timeout is not possible; system auto-submits.',
    ],
    navigation: [
      'Use question palette to jump to any question.',
      'Use mark for review to revisit before final submit.',
      'Use clear response to remove selected option.',
      'You can switch between Mathematics, Physics, and Chemistry tabs anytime before final submit.',
    ],
    marking: [
      'Physics and Chemistry generally carry 1 mark per question.',
      'Mathematics generally carries 2 marks per question.',
      'Negative marking depends on exam configuration.',
    ],
  };

  const handleConfirm = () => {
    if (!activeExam) {
      navigate('/dashboard');
      return;
    }
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
            You are about to take the <strong>{activeExam?.name || 'Selected Exam'}</strong>. Please read the
            following instructions carefully before proceeding.
          </p>
          <p>
            Duration: <strong>{activeExam?.duration_minutes || 'NA'} minutes</strong>
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
