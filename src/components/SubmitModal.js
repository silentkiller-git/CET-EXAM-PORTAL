import React from 'react';

function SubmitModal({ questions = [], sectionName, onConfirm, onCancel }) {
  const attemptedCount = questions.filter((q) => q.status === 'answered').length;
  const notAttemptedCount = questions.filter((q) => q.status !== 'answered').length;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>⚠️ Submit Test</h2>
        <p>Are you sure you want to submit the test?</p>
        <p style={{ fontSize: '14px', color: '#999' }}>
          Once submitted, you will not be able to return or reattempt this test.
        </p>

        <div className="modal-stats">
          <div className="stat-row">
            <span className="stat-label">Total Questions:</span>
            <span className="stat-value">{questions.length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Attempted Questions:</span>
            <span className="stat-value" style={{ color: '#51cf66' }}>
              {attemptedCount}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Not Attempted:</span>
            <span className="stat-value" style={{ color: '#ff6b6b' }}>
              {notAttemptedCount}
            </span>
          </div>
        </div>

        <div className="modal-buttons">
          <button className="modal-btn modal-btn-cancel" onClick={onCancel}>
            Cancel & Return to Test
          </button>
          <button className="modal-btn modal-btn-submit" onClick={onConfirm}>
            Yes, Submit Test
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubmitModal;
