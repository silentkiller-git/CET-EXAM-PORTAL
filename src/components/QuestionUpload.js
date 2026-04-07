import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/QuestionUpload.css';

function QuestionUpload() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState(null);
  const [folderFiles, setFolderFiles] = useState([]);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'folder'
  const [uploadStats, setUploadStats] = useState(null);
  const [showFormat, setShowFormat] = useState(false);

  /**
   * Download the CSV template for question upload
   */
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/questions/template/download', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'questions_template.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError(`Failed to download template: ${err.message}`);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.zip')) {
        setError('Please select a CSV or ZIP file');
        return;
      }
      setFile(selectedFile);
      setFolderFiles([]);
      setError('');
      setSuccess('');
    }
  };

  /**
   * Handle folder selection
   */
  const handleFolderChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setFolderFiles(files);
      setFile(null);
      setError('');
      setSuccess('');
    }
  };

  /**
   * Upload the CSV file with questions
   */
  const handleUpload = async (e) => {
    e.preventDefault();
    if (uploadMode === 'file' && !file) {
      setError('Please select a CSV or ZIP file');
      return;
    }
    if (uploadMode === 'folder' && folderFiles.length === 0) {
      setError('Please select a folder containing your CSV and images');
      return;
    }
    if (!examId) {
      setError('Exam ID is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      let endpoint = '';

      if (uploadMode === 'file') {
        const isZip = file.name.endsWith('.zip');
        endpoint = isZip ? `/api/admin/questions/bulk-zip?exam_id=${examId}` : `/api/admin/questions/bulk?exam_id=${examId}`;
        const fieldName = isZip ? 'zip_file' : 'csv_file';
        formData.append(fieldName, file);
      } else {
        endpoint = `/api/admin/questions/bulk-directory`;
        formData.append('exam_id', examId);
        folderFiles.forEach((f) => {
          formData.append('files', f);
        });
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to upload questions');
      }

      setUploadStats(data);
      setSuccess(`Successfully uploaded ${data.created} questions!`);

      // Reset form
      setFile(null);
      setFolderFiles([]);
      const fileInput = document.getElementById('csv-file');
      if (fileInput) fileInput.value = '';
      const folderInput = document.getElementById('folder-upload');
      if (folderInput) folderInput.value = '';

      // Optional: Redirect after 3 seconds
      setTimeout(() => {
        navigate(`/institute-dashboard`);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="question-upload-container">
      <div className="upload-box">
        <h1>📋 Bulk Upload Questions</h1>
        <p className="subtitle">
          Upload multiple questions using image paths and correct answers only (options are fixed as A/B/C/D)
        </p>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
          <button 
            className={`btn ${uploadMode === 'file' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setUploadMode('file'); setError(''); }}
            type="button"
          >
            File Upload (.csv, .zip)
          </button>
          <button 
            className={`btn ${uploadMode === 'folder' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setUploadMode('folder'); setError(''); }}
            type="button"
          >
            Folder Upload (Directory)
          </button>
        </div>

        {/* Error Message */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Success Message */}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Upload Statistics */}
        {uploadStats && (
          <div className="stats-box">
            <h3>Upload Summary</h3>
            <div className="stat-item success">✓ Created: {uploadStats.created} questions</div>
            {uploadStats.failed > 0 && (
              <div className="stat-item error">✗ Failed: {uploadStats.failed} rows</div>
            )}
            {uploadStats.skipped > 0 && (
              <div className="stat-item warning">⚠ Skipped: {uploadStats.skipped} rows</div>
            )}
            <div className="stat-item info">Total Rows: {uploadStats.total_rows}</div>
            
            {uploadStats.errors && uploadStats.errors.length > 0 && (
              <div className="errors-box">
                <h4>Errors Details (First 10):</h4>
                <ul>
                  {uploadStats.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Format Information Section */}
        <div className="format-section">
          <button
            type="button"
            className="btn btn-info"
            onClick={() => setShowFormat(!showFormat)}
          >
            {showFormat ? '▼ Hide Format' : '► Show CSV Format'}
          </button>

          {showFormat && (
            <div className="format-details">
              <h3>CSV Format Guide</h3>
              <p>
                Your CSV file must include the following columns (header row required):
              </p>
              <table className="format-table">
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>section_id</code></td>
                    <td>UUID</td>
                    <td>Valid section UUID for this exam</td>
                    <td>550e8400-e29b-41d4-a716-446655440000</td>
                  </tr>
                  <tr>
                    <td><code>question_image_url</code></td>
                    <td>String</td>
                    <td>URL or path to question image</td>
                    <td>https://example.com/q1.png</td>
                  </tr>
                  <tr>
                    <td><code>correct_option</code></td>
                    <td>Letter</td>
                    <td>Correct answer: A, B, C, or D</td>
                    <td>A</td>
                  </tr>
                  <tr>
                    <td><code>difficulty</code></td>
                    <td>String</td>
                    <td>Optional: easy, medium, or hard</td>
                    <td>medium</td>
                  </tr>
                </tbody>
              </table>

              <div className="format-notes">
                <h4>Important Notes:</h4>
                <ul>
                  <li><strong>Options are fixed as A, B, C, D</strong> for all questions.</li>
                  <li>Admin only needs to provide the <code>correct_option</code> per question.</li>
                  <li>The <code>difficulty</code> column is optional</li>
                  <li>One row per question (do not include headers in the data)</li>
                  <li>If any row has errors, it will be skipped and reported</li>
                </ul>
              </div>

              <div className="example-box">
                <h4>Example CSV (First 3 rows):</h4>
                <pre>{`section_id,question_image_url,correct_option,difficulty
550e8400-e29b-41d4-a716-446655440000,https://example.com/q1.png,A,easy
550e8400-e29b-41d4-a716-446655440001,https://example.com/q2.png,B,medium
550e8400-e29b-41d4-a716-446655440000,https://example.com/q3.png,C,hard`}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="upload-form">
          {uploadMode === 'file' ? (
            <div className="form-group">
              <label htmlFor="csv-file" className="file-label">
                Select CSV or ZIP File
              </label>
              <input
                id="csv-file"
                type="file"
                accept=".csv,.zip"
                onChange={handleFileChange}
                disabled={loading}
                className="file-input"
                required
              />
              {file && (
                <p className="file-name">
                  ✓ Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="folder-upload" className="file-label">
                Select Folder (Must contain questions.csv and images)
              </label>
              <input
                id="folder-upload"
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleFolderChange}
                disabled={loading}
                className="file-input"
                required
              />
              {folderFiles.length > 0 && (
                <p className="file-name">
                  ✓ Selected <strong>{folderFiles.length}</strong> files in folder.
                </p>
              )}
            </div>
          )}

          <div className="button-group">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || (uploadMode === 'file' ? !file : folderFiles.length === 0)}
            >
              {loading ? 'Uploading...' : 'Upload Questions'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownloadTemplate}
              disabled={loading}
            >
              📥 Download Template
            </button>

            <button
              type="button"
              className="btn btn-cancel"
              onClick={() => navigate('/institute-dashboard')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="help-section">
          <h3>🆘 Need Help?</h3>
          <ol>
            <li>Click <strong>"Download Template"</strong> to get a sample CSV file</li>
            <li>Edit the template with your questions and options</li>
            <li>Make sure Options A, B, C, D text are correctly placed in those columns</li>
            <li>Save the file as CSV</li>
            <li>Click <strong>"Upload Questions"</strong> to import all questions at once</li>
          </ol>

          <div className="tips">
            <h4>💡 Tips:</h4>
            <ul>
              <li>Section IDs are UUIDs - copy them from your exam sections list</li>
              <li>For ZIP or Folder uploads, place your `.csv` file at the root along with your images. The `question_image_url` in the CSV should exactly match the image filename.</li>
              <li>Options text can be plain text or include special characters</li>
              <li>Correct answer must be A, B, C, or D - not numbers</li>
              <li>If upload fails for some rows, check the error messages for details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionUpload;
