import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAdminResults,
  fetchAdminExams,
  fetchExamMetrics,
  downloadAdminFile,
  downloadCredentials,
  getResultsExportCsvUrl,
  getResultsExportPdfUrl,
  triggerEvaluation,
  deleteExam
} from '../api/client';

function InstituteDashboard({ institute, onLogout }) {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [showEvaluationDashboard, setShowEvaluationDashboard] = useState(false);
  const [evaluationRunning, setEvaluationRunning] = useState(false);
  const [evaluationTaskId, setEvaluationTaskId] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAdminExams();
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setExams(list);
        if (list.length) setSelectedExamId(list[0].id);
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

  useEffect(() => {
    if (!selectedExamId) return;
    let mounted = true;

    const loadMetrics = async () => {
      try {
        const data = await fetchExamMetrics(selectedExamId);
        if (mounted) setMetrics(data);
      } catch {
      }
    };

    loadMetrics();
    const timer = setInterval(loadMetrics, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [selectedExamId]);

  const handleEvaluate = async () => {
    if (!selectedExamId) return;
    setEvaluationRunning(true);
    setActionMessage('');
    try {
      const result = await triggerEvaluation(selectedExamId);
      setEvaluationTaskId(result.task_id || '');
      setActionMessage(`Evaluation queued. Task ID: ${result.task_id}`);
    } catch (err) {
      setActionMessage(err.message || 'Failed to trigger evaluation');
    } finally {
      setEvaluationRunning(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!selectedExamId) return;
    
    const selectedExam = exams.find(e => e.id === selectedExamId);
    
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the exam "${selectedExam?.name}"? All related students, questions, and records will be deleted forever.`
    );
    if (!confirmed) return;

    setActionMessage('Deleting exam...');
    try {
      await deleteExam(selectedExamId);
      setActionMessage('Exam deleted successfully!');
      // Refresh the list
      const data = await fetchAdminExams();
      setExams(data);
      if (data.length > 0) {
        setSelectedExamId(data[0].id);
      } else {
        setSelectedExamId('');
        setMetrics(null);
      }
    } catch (err) {
      setActionMessage(err.message || 'Failed to delete exam');
    }
  };

  const handleDownloadCsv = async () => {
    if (!selectedExamId) return;
    try {
      const data = await fetchAdminResults(selectedExamId, 1, 1);
      if (!data?.total) {
        setActionMessage('No evaluated results found yet. Click Evaluate and wait a moment before downloading.');
        return;
      }
      await downloadAdminFile(getResultsExportCsvUrl(selectedExamId), `results_${selectedExamId}.csv`);
    } catch (err) {
      setActionMessage(err.message || 'Failed to download CSV');
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedExamId) return;
    try {
      const data = await fetchAdminResults(selectedExamId, 1, 1);
      if (!data?.total) {
        setActionMessage('No evaluated results found yet. Click Evaluate and wait a moment before downloading.');
        return;
      }
      await downloadAdminFile(getResultsExportPdfUrl(selectedExamId), `results_${selectedExamId}.pdf`);
    } catch (err) {
      setActionMessage(err.message || 'Failed to download PDF');
    }
  };

  const handleDownloadCredentials = async () => {
    if (!selectedExamId) return;
    setActionMessage('Downloading credentials...');
    try {
      await downloadCredentials(selectedExamId);
      setActionMessage('✓ Student credentials downloaded successfully!');
    } catch (err) {
      setActionMessage(err.message || 'Failed to download credentials. Make sure students were uploaded first.');
    }
  };

  return (
    <div className="institute-dashboard-container">
      <div className="institute-dashboard-header">
        <div className="institute-dashboard-left">
          <div className="institute-logo">
            <span className="institute-logo-icon">🏛️</span>
            <div className="institute-logo-text">
              <div className="institute-logo-brand">Winning Hub</div>
              <div className="institute-logo-subtitle">ADMIN PANEL</div>
            </div>
          </div>
        </div>
        <div className="institute-dashboard-center">
          <h1>Institute Dashboard</h1>
          <p className="dashboard-welcome">Welcome, {institute?.name || institute?.email || 'Admin'}</p>
        </div>
        <div className="institute-dashboard-right">
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="institute-dashboard-content">
        {/* Status Cards */}
        {metrics && (
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Enrolled</div>
              <div className="metric-value">{metrics.total_enrolled ?? 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">In Progress</div>
              <div className="metric-value" style={{ color: '#3b82f6' }}>{metrics.in_progress ?? 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Completed</div>
              <div className="metric-value" style={{ color: '#10b981' }}>{metrics.completed ?? 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Completion Rate</div>
              <div className="metric-value" style={{ color: '#f59e0b' }}>{metrics.completion_pct ?? 0}%</div>
            </div>
          </div>
        )}

        {/* Exam Selection */}
        <div className="dashboard-card">
          <h2>📚 Select Exam</h2>
          {loading && <p>Loading exams...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && exams.length === 0 && <p>No exams created yet. Create your first exam to get started.</p>}
          {exams.length > 0 && (
            <div className="form-group">
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="dashboard-select"
              >
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} ({exam.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons Grid */}
        <div className="dashboard-card">
          <h2>⚙️ Exam Actions</h2>
          <div className="action-buttons-grid">
            <button className="action-btn primary" onClick={() => navigate('/create-test')}>
              ➕ Create New Exam
            </button>
            <button className="action-btn" onClick={() => navigate('/manage-slots')}>
              📅 Manage Schedule
            </button>
            {selectedExamId && (
              <>
                <button className="action-btn" onClick={() => navigate(`/exam-sections/${selectedExamId}`)}>
                  📑 Configure Sections
                </button>
                <button className="action-btn" onClick={() => navigate(`/exam-setup/${selectedExamId}`)}>
                  👥 Upload Students
                </button>
                <button className="action-btn" onClick={handleDownloadCredentials}>
                  📥 Download Credentials
                </button>
                <button className="action-btn" onClick={handleDownloadCsv}>
                  📊 Export Results (CSV)
                </button>
                <button className="action-btn" onClick={handleDownloadPdf}>
                  📄 Export Results (PDF)
                </button>
                <button className="action-btn success" onClick={handleEvaluate} disabled={evaluationRunning}>
                  {evaluationRunning ? '⏳ Evaluating...' : '🔄 Trigger Evaluation'}
                </button>
                <button className="action-btn danger" onClick={handleDeleteExam}>
                  🗑 Delete Exam
                </button>
              </>
            )}
          </div>
          {actionMessage && (
            <div className="action-message">
              {actionMessage}
            </div>
          )}
        </div>
      </div>

      {/* Evaluation Modal */}
      {showEvaluationDashboard && (
        <div className="modal-overlay" onClick={() => setShowEvaluationDashboard(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Evaluation Dashboard</h2>
              <button className="modal-close" onClick={() => setShowEvaluationDashboard(false)}>✕</button>
            </div>
            
            <p className="modal-exam-info">
              Selected exam: <strong>{exams.find((e) => e.id === selectedExamId)?.name || 'N/A'}</strong>
            </p>
            
            <p className="modal-description">
              Click Evaluate to calculate student scores section-wise, then download results as CSV or PDF.
            </p>

            {evaluationTaskId && (
              <p className="modal-task-info">
                Last evaluation task: <strong>{evaluationTaskId}</strong>
              </p>
            )}

            {actionMessage && (
              <div className="modal-message success">
                {actionMessage}
              </div>
            )}

            <div className="modal-buttons">
              <button
                className="action-btn success"
                onClick={handleEvaluate}
                disabled={!selectedExamId || evaluationRunning}
              >
                {evaluationRunning ? '⏳ Evaluating...' : '🔄 Trigger Evaluation'}
              </button>

              <button
                className="action-btn"
                onClick={handleDownloadCsv}
                disabled={!selectedExamId}
              >
                📊 Download CSV
              </button>

              <button
                className="action-btn"
                onClick={handleDownloadPdf}
                disabled={!selectedExamId}
              >
                📄 Download PDF
              </button>

              <button
                className="action-btn"
                onClick={() => setShowEvaluationDashboard(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstituteDashboard;
