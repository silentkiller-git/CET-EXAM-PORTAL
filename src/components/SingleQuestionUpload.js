import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchExamSections, addQuestion } from '../api/client';
import '../styles/QuestionUpload.css';

function SingleQuestionUpload() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sections, setSections] = useState([]);

  const [form, setForm] = useState({
    section_id: '',
    correct_option: 1,
    difficulty: 'medium'
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const loadSections = async () => {
      try {
        const data = await fetchExamSections(examId);
        setSections(data);
        if (data.length > 0) {
          setForm((prev) => ({ ...prev, section_id: data[0].id }));
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch sections. Please refresh.');
      }
    };
    if (examId) loadSections();
  }, [examId]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        setError('Please select a valid image file (.jpg, .jpeg, .png, .webp)');
        return;
      }
      setImageFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.section_id) {
      setError('Please select a section');
      return;
    }
    if (!imageFile) {
      setError('Please select a question image');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('exam_id', examId);
      formData.append('section_id', form.section_id);
      formData.append('correct_option', form.correct_option);
      formData.append('difficulty', form.difficulty);
      formData.append('question_image', imageFile);

      await addQuestion(formData);
      
      setSuccess('Question added successfully!');
      setTimeout(() => {
        setSuccess('');
        setImageFile(null);
        setForm((prev) => ({ ...prev }));
        const fileInput = document.getElementById('question-image');
        if (fileInput) fileInput.value = '';
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="question-upload-container">
      <div className="upload-box" style={{ maxWidth: 800 }}>
        <h1>📸 Add Single Question</h1>
        <p className="subtitle">Upload a question image and specify the options</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="file-label">Select Section</label>
            <select
              value={form.section_id}
              onChange={(e) => setField('section_id', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #ddd' }}
              required
            >
              {sections.length === 0 ? <option value="">Loading sections...</option> : null}
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label htmlFor="question-image" className="file-label">Select Question Image (.jpg, .png, .webp)</label>
            <input
              id="question-image"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleImageChange}
              disabled={loading}
              className="file-input"
              required
            />
            {imageFile && (
              <p className="file-name" style={{ marginTop: 10, fontSize: '0.9rem', color: '#16a34a' }}>
                ✓ Selected: <strong>{imageFile.name}</strong> ({(imageFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div style={{ marginBottom: 14, fontSize: '0.92rem', color: '#475569' }}>
            Options are fixed as <strong>A, B, C, D</strong> for every question. Select only the correct option below.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: 25 }}>
            <div className="form-group">
              <label className="file-label">Correct Option</label>
              <select
                value={form.correct_option}
                onChange={(e) => setField('correct_option', Number(e.target.value))}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #ddd' }}
              >
                <option value={1}>Option A (1)</option>
                <option value={2}>Option B (2)</option>
                <option value={3}>Option C (3)</option>
                <option value={4}>Option D (4)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="file-label">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setField('difficulty', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #ddd' }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading || !imageFile}>
              {loading ? 'Uploading...' : 'Add Question'}
            </button>
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/institute-dashboard')} disabled={loading}>
              Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SingleQuestionUpload;
