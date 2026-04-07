import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { uploadStudentCsv, downloadCredentials } from '../api/client';
import '../styles/QuestionUpload.css';

function ExamSetupWizard() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadStats, setUploadStats] = useState(null);

  const [csvFile, setCsvFile] = useState(null);
  const [showFormat, setShowFormat] = useState(false);

  const handleCsvChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
        setError('Please select a valid .csv or .xlsx Answer Key / Roster file.');
        return;
      }
      setCsvFile(selectedFile);
      setError('');
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setError('You must provide the Student Roster CSV.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setUploadStats(null);

    try {
      const data = await uploadStudentCsv(examId, csvFile);

      setUploadStats(data);
      setSuccess('Student Roster uploaded successfully! Processing in background...');

      setTimeout(() => {
        navigate('/institute-dashboard');
      }, 4000);

    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="question-upload-container">
      <div className="upload-box" style={{ maxWidth: 850 }}>
        <h1>⚙️ Quick Exam Setup</h1>
        <p className="subtitle">
          Upload your Question Images and the Student Roster/Answer Key to finalize Exam creation.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {uploadStats && (
          <div className="stats-box" style={{ marginBottom: 20 }}>
            <h3>Setup Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="stat-item success">✓ Status: {uploadStats.status}</div>
              <div className="stat-item success">✓ Task ID: {uploadStats.task_id}</div>
            </div>
            <p style={{ marginTop: 15, fontSize: '0.9rem', color: '#666' }}>
              Student credentials are being generated in the background. You can safely leave this page.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => downloadCredentials(examId)}
              style={{ marginTop: 15, padding: '10px 20px', fontSize: '1rem' }}
            >
              📥 Download Student Credentials (Excel)
            </button>
          </div>
        )}

        {/* Format Information Section */}
        <div className="format-section" style={{ marginBottom: '25px' }}>
          <button
            type="button"
            className="btn btn-info"
            onClick={() => setShowFormat(!showFormat)}
            style={{ width: '100%', marginBottom: 10 }}
          >
            {showFormat ? '▼ Hide CSV Format Instructions' : '► Show Roster / Answer Key CSV Format'}
          </button>

          {showFormat && (
            <div className="format-details" style={{ textAlign: 'left', padding: 15, background: '#f8f9fa', borderRadius: 8 }}>
              <p>Your CSV file <strong>must</strong> include the following column headers exactly:</p>
              <ul style={{ lineHeight: '1.6' }}>
                <li><code>first_name</code> : Student's First Name</li>
                <li><code>last_name</code> : Student's Last Name</li>
                <li><code>email</code> : (Optional) Email address</li>
              </ul>

              <div className="example-box" style={{ marginTop: 15 }}>
                <h4>Example CSV (First 3 rows):</h4>
                <pre style={{ background: '#333', color: '#fff', padding: 10, borderRadius: 4 }}>{`first_name,last_name,email
Atharva,Kadu,atharva@example.com
John,Doe,john@example.com
Jane,Smith,jane@example.com`}</pre>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSetup} className="upload-form">
          {/* CSV Upload */}
          <div className="form-group" style={{ marginBottom: 25, padding: 20, border: '2px dashed #059669', borderRadius: 8, background: '#f0fdf4' }}>
            <label htmlFor="csv-file" className="file-label" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              📄 Upload Student Roster CSV
            </label>
            <p style={{ margin: '5px 0 15px 0', fontSize: '0.9rem', color: '#666' }}>
              Select the CSV file to automatically generate and assign student credentials for this exam.
            </p>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleCsvChange}
              disabled={loading}
              className="file-input"
              required
            />
            {csvFile && (
              <p className="file-name" style={{ color: '#16a34a', marginTop: 10, fontWeight: 'bold' }}>
                ✓ Selected: {csvFile.name}
              </p>
            )}
          </div>

          <div className="button-group" style={{ marginTop: 30 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !csvFile}
              style={{ padding: '15px 30px', fontSize: '1.1rem' }}
            >
              {loading ? 'Processing...' : '🚀 Finalize Exam Setup'}
            </button>

            <button
              type="button"
              className="btn btn-cancel"
              onClick={() => navigate('/institute-dashboard')}
              disabled={loading}
            >
              Skip / Do Later
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExamSetupWizard;
