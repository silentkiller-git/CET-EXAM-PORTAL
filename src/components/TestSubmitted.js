import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStudentResult } from '../api/client';

function TestSubmitted({ student }) {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [resultError, setResultError] = useState('');
  const [loadingResult, setLoadingResult] = useState(false);
  const referenceId = (sessionStorage.getItem('cet_last_attempt') || localStorage.getItem('cet_last_attempt') || 'NA').slice(0, 12).toUpperCase();
  const submissionTime = sessionStorage.getItem('cet_submission_time') || localStorage.getItem('cet_submission_time') || new Date().toISOString();
  const submissionReason = sessionStorage.getItem('cet_submission_reason') || 'manual';
  const submittedStudentName = sessionStorage.getItem('cet_submitted_student_name') || student?.name || student?.username || 'Student';
  const sectionNameMapRaw = sessionStorage.getItem('cet_section_name_map') || '{}';
  const sectionTimeSpentRaw = sessionStorage.getItem('cet_section_time_spent') || '{}';
  let sectionTimeSpent = {};
  let sectionNameMap = {};
  try {
    sectionNameMap = JSON.parse(sectionNameMapRaw);
  } catch {
    sectionNameMap = {};
  }
  try {
    sectionTimeSpent = JSON.parse(sectionTimeSpentRaw);
  } catch {
    sectionTimeSpent = {};
  }

  const formatTime = (seconds) => {
    const total = Math.max(0, Number(seconds || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  const activeExam = (() => {
    try {
      const raw = sessionStorage.getItem('cet_active_exam') || localStorage.getItem('cet_active_exam');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const handleBackToLogin = () => {
    sessionStorage.removeItem('cet_active_exam');
    localStorage.removeItem('cet_active_exam');
    navigate('/');
  };

  const handleShowResult = async () => {
    const examId = activeExam?.id;
    if (!examId || loadingResult) {
      return;
    }

    setLoadingResult(true);
    setResultError('');
    try {
      const data = await fetchStudentResult(examId);
      setResult(data);
    } catch (err) {
      setResult(null);
      setResultError(err.message || 'Result is not available right now');
    } finally {
      setLoadingResult(false);
    }
  };

  return (
    <div className="submitted-container">
      <div className="submitted-box">
        <div className="checkmark">✓</div>
        <h1>Test Submitted Successfully!</h1>
        <p>Dear {submittedStudentName}, your test has been submitted successfully.</p>

        <div className="reference-id">Reference ID: {referenceId}</div>

        <div style={{ textAlign: 'left', margin: '20px 0', fontSize: '14px', color: '#666' }}>
          <p>
            <strong>Submission Time:</strong> {new Date(submissionTime).toLocaleString()}
          </p>
          <p>
            <strong>Submission Type:</strong> {submissionReason === 'timeout' ? 'Auto-submitted (Time Expired)' : 'Manual Submission'}
          </p>
          <p>
            <strong>Exam:</strong> {activeExam?.name || 'NA'}
          </p>
          {Object.keys(sectionTimeSpent).length > 0 ? (
            <div style={{ marginTop: 10 }}>
              <strong>Section-wise Time Spent:</strong>
              <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                {Object.entries(sectionTimeSpent).map(([sectionId, seconds]) => (
                  <li key={sectionId}>
                    {sectionNameMap[sectionId] || sectionId}: {formatTime(seconds)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p style={{ marginTop: '10px', fontSize: '13px', color: '#999' }}>
            Click Show Result to view your evaluated score when your institute allows immediate visibility.
          </p>
        </div>

        <button
          className="login-again-btn"
          onClick={handleShowResult}
          disabled={loadingResult || !activeExam?.id}
          style={{ marginBottom: 12 }}
        >
          {loadingResult ? 'Loading Result...' : 'Show Result'}
        </button>

        {resultError ? (
          <p style={{ color: '#d32f2f', margin: '4px 0 12px' }}>{resultError}</p>
        ) : null}

        {result ? (
          <div style={{ textAlign: 'left', width: '100%', background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Your Result</h3>
            <p style={{ margin: '6px 0' }}><strong>Exam:</strong> {result.exam_name}</p>
            <p style={{ margin: '6px 0' }}><strong>Total Score:</strong> {result.total_score}</p>
            <p style={{ margin: '6px 0' }}><strong>Correct:</strong> {result.total_correct}</p>
            <p style={{ margin: '6px 0' }}><strong>Wrong:</strong> {result.total_wrong}</p>
            <p style={{ margin: '6px 0' }}><strong>Unattempted:</strong> {result.total_unattempted}</p>
            <p style={{ margin: '6px 0' }}><strong>Negative Marks:</strong> {result.negative_marks}</p>
            <p style={{ margin: '6px 0' }}><strong>Rank:</strong> {result.rank ?? 'NA'}</p>
            <p style={{ margin: '6px 0' }}><strong>Percentile:</strong> {result.percentile ?? 'NA'}</p>
            <p style={{ margin: '6px 0', fontSize: '13px', color: '#64748b' }}>
              Evaluated At: {new Date(result.evaluated_at).toLocaleString()}
            </p>
          </div>
        ) : null}

        <button className="login-again-btn" onClick={handleBackToLogin}>
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default TestSubmitted;
