import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStudentExams } from '../api/client';

function Dashboard({ student, onLogout }) {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchStudentExams();
        if (mounted) setExams(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load exams');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleStartTest = (exam) => {
    sessionStorage.setItem('cet_active_exam', JSON.stringify(exam));
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
            <span className="info-value">{student?.name || student?.username || 'Student'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Username:</span>
            <span className="info-value">{student?.username || 'NA'}</span>
          </div>
        </div>

        <div className="student-info">
          <h2>Assigned Exams</h2>
          {loading ? <p>Loading exams...</p> : null}
          {error ? <p style={{ color: '#d32f2f' }}>{error}</p> : null}
          {!loading && !error && exams.length === 0 ? <p>No assigned exams found.</p> : null}
          {!loading && exams.length > 0 ? (
            <div>
              {exams.map((exam) => (
                <div className="info-item" key={exam.id}>
                  <div>
                    <div className="info-value" style={{ fontWeight: 700 }}>{exam.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Duration: {exam.duration_minutes} min</div>
                  </div>
                  <button className="start-test-btn" style={{ width: 'auto', padding: '10px 14px' }} onClick={() => handleStartTest(exam)}>
                    Start
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <button className="cancel-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
