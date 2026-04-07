import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExam } from '../api/client';

function CreateTest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    duration_minutes: 180,
    total_marks: 200,
    start_time: '',
    end_time: '',
    negative_marking_enabled: false,
    negative_mark_fraction: 0.25,
    randomize_questions: true,
    show_result_immediately: false,
  });

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        sections: [],
      };

      if (Number.isNaN(Date.parse(payload.start_time)) || Number.isNaN(Date.parse(payload.end_time))) {
        throw new Error('Please select valid start and end date/time');
      }

      const newExam = await createExam(payload);
      console.log("[CreateExam] API Response:", newExam);
      
      if (!newExam || !newExam.id) {
         throw new Error("Backend did not return an exam ID");
      }
      
      navigate(`/exam-sections/${newExam.id}`);
    } catch (err) {
      console.error("[CreateExam] Error:", err);
      setError(err.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-test-container">
      {/* Header */}
      <div className="create-test-header">
        <div className="create-test-title-section">
          <span className="create-test-icon">✏️</span>
          <div>
            <h1>Create New Exam</h1>
            <p className="create-test-subtitle">Configure exam parameters and settings</p>
          </div>
        </div>
        <button className="back-btn-header" onClick={() => navigate('/institute-dashboard')}>
          ← Dashboard
        </button>
      </div>

      {/* Content */}
      <div className="create-test-content">
        <form onSubmit={handleSubmit} className="create-test-form">
          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Basic Info Section */}
          <div className="form-section">
            <h2 className="section-title">📋 Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="exam-name">Exam Name *</label>
              <input
                id="exam-name"
                type="text"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g., Mathematics 2024"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="exam-desc">Description</label>
              <textarea
                id="exam-desc"
                rows="3"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Enter exam description..."
              />
            </div>
          </div>

          {/* Duration & Marks Section */}
          <div className="form-section">
            <h2 className="section-title">⏱️ Duration & Marks</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Duration (minutes) *</label>
                <input
                  id="duration"
                  type="number"
                  min="1"
                  value={form.duration_minutes}
                  onChange={(e) => setField('duration_minutes', Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="marks">Total Marks *</label>
                <input
                  id="marks"
                  type="number"
                  min="1"
                  value={form.total_marks}
                  onChange={(e) => setField('total_marks', Number(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="form-section">
            <h2 className="section-title">📅 Schedule</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start-time">Start Date & Time *</label>
                <input
                  id="start-time"
                  type="datetime-local"
                  value={form.start_time}
                  onInput={(e) => setField('start_time', e.target.value)}
                  onChange={(e) => setField('start_time', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="end-time">End Date & Time *</label>
                <input
                  id="end-time"
                  type="datetime-local"
                  value={form.end_time}
                  onInput={(e) => setField('end_time', e.target.value)}
                  onChange={(e) => setField('end_time', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Scoring Rules Section */}
          <div className="form-section">
            <h2 className="section-title">⚙️ Scoring Rules</h2>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.negative_marking_enabled}
                  onChange={(e) => setField('negative_marking_enabled', e.target.checked)}
                />
                <span>Enable Negative Marking</span>
              </label>
              <small>Deduct marks for incorrect answers</small>
            </div>

            {form.negative_marking_enabled && (
              <div className="form-group">
                <label htmlFor="negative-fraction">Negative Mark Fraction</label>
                <input
                  id="negative-fraction"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={form.negative_mark_fraction}
                  onChange={(e) => setField('negative_mark_fraction', Number(e.target.value))}
                />
                <small>E.g., 0.25 means 1/4 of the mark value</small>
              </div>
            )}
          </div>

          {/* Result Settings Section */}
          <div className="form-section">
            <h2 className="section-title">👁️ Result Visibility</h2>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.show_result_immediately}
                  onChange={(e) => setField('show_result_immediately', e.target.checked)}
                />
                <span>Show Results Immediately After Evaluation</span>
              </label>
              <small>Students can view their results right away, otherwise they wait for admin approval</small>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              className="create-btn primary"
              type="submit"
              disabled={loading}
            >
              {loading ? '⏳ Creating...' : '✓ Create & Add Sections'}
            </button>
            <button
              className="create-btn secondary"
              type="button"
              onClick={() => navigate('/institute-dashboard')}
            >
              ✕ Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTest;
