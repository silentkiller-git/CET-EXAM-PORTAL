import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminExams, updateExam } from '../api/client';

function ManageSlots() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const loadExams = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminExams();
      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const patchExam = async (examId, patch) => {
    setActionMsg('');
    try {
      await updateExam(examId, patch);
      if (Object.prototype.hasOwnProperty.call(patch, 'show_result_immediately')) {
        setActionMsg(`Student result visibility turned ${patch.show_result_immediately ? 'ON' : 'OFF'} successfully!`);
      } else {
        setActionMsg(`Status updated to "${patch.status}" successfully!`);
      }
      await loadExams();
    } catch (err) {
      setError(err.message || 'Update failed');
    }
  };

  const statusBadge = (status) => {
    const colors = {
      draft: { bg: '#f3f4f6', color: '#374151', icon: '📝' },
      published: { bg: '#dbeafe', color: '#1d4ed8', icon: '📢' },
      active: { bg: '#dcfce7', color: '#15803d', icon: '▶️' },
      completed: { bg: '#fef3c7', color: '#92400e', icon: '✅' },
      evaluated: { bg: '#ede9fe', color: '#6d28d9', icon: '📊' },
    };
    const c = colors[status] || { bg: '#f3f4f6', color: '#374151', icon: '❓' };
    return (
      <span style={{
        background: c.bg, color: c.color, padding: '6px 14px',
        borderRadius: 20, fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase',
        display: 'inline-flex', alignItems: 'center', gap: '6px'
      }}>
        {c.icon} {status}
      </span>
    );
  };

  return (
    <div className="manage-slots-container">
      {/* Header */}
      <div className="manage-slots-header">
        <div className="manage-slots-title">
          <span style={{ fontSize: 32, marginRight: 12 }}>📅</span>
          <div>
            <h1>Manage Exam Schedule & Status</h1>
            <p className="manage-slots-subtitle">Control exam lifecycle, visibility, and publication settings</p>
          </div>
        </div>
        <button className="back-btn-header" onClick={() => navigate('/institute-dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Content */}
      <div className="manage-slots-content">
        {/* Status Messages */}
        {error && <div className="error-message">{error}</div>}
        {actionMsg && <div className="success-message">{actionMsg}</div>}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading exams...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && exams.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Exams Found</h3>
            <p>Create your first exam in the dashboard to manage schedules.</p>
          </div>
        )}

        {/* Exams Table */}
        {!loading && exams.length > 0 && (
          <div className="exams-table-wrapper">
            <table className="exams-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Show Results</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} className="exam-row">
                    <td className="exam-name">
                      <strong>{exam.name}</strong>
                    </td>
                    <td className="exam-time">
                      {new Date(exam.start_time).toLocaleString()}
                    </td>
                    <td className="exam-time">
                      {new Date(exam.end_time).toLocaleString()}
                    </td>
                    <td className="exam-status">
                      {statusBadge(exam.status)}
                    </td>
                    <td className="exam-visibility">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={!!exam.show_result_immediately}
                          onChange={(e) => patchExam(exam.id, { show_result_immediately: e.target.checked })}
                          className="checkbox-input"
                        />
                        <span className="checkbox-text">
                          {exam.show_result_immediately ? '✓ On' : 'Off'}
                        </span>
                      </label>
                    </td>
                    <td className="exam-actions">
                      <div className="action-buttons">
                        {exam.status === 'draft' && (
                          <button
                            className="action-btn-small publish"
                            onClick={() => patchExam(exam.id, { status: 'published' })}
                            title="Publish this exam"
                          >
                            📢 Publish
                          </button>
                        )}
                        {(exam.status === 'draft' || exam.status === 'published') && (
                          <button
                            className="action-btn-small activate"
                            onClick={() => patchExam(exam.id, { status: 'active' })}
                            title="Activate this exam"
                          >
                            ▶️ Activate
                          </button>
                        )}
                        {exam.status === 'active' && (
                          <button
                            className="action-btn-small complete"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to mark "${exam.name}" as completed? Students will no longer be able to submit.`)) {
                                patchExam(exam.id, { status: 'completed' });
                              }
                            }}
                            title="Mark exam as completed"
                          >
                            ✅ Complete
                          </button>
                        )}
                        {exam.status === 'completed' && (
                          <span className="status-text completed">
                            Exam finished
                          </span>
                        )}
                        {exam.status === 'evaluated' && (
                          <span className="status-text evaluated">
                            Results published
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageSlots;
