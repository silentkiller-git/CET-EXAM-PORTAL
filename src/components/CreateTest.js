import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────
   Helper: parse CSV text into an array of row objects
   Handles quoted fields and commas inside quotes.
───────────────────────────────────────────────*/
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];

  // Parse a single CSV line respecting quoted fields
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(row);
  }
  return rows;
}

/* ─────────────────────────────────────────────
   Helper: convert CSV rows → question objects
───────────────────────────────────────────────*/
function csvRowsToQuestions(rows) {
  return rows
    .filter((row) => row.question && row.question.trim() !== '')
    .map((row, idx) => ({
      id: idx + 1,
      number: row.number || String(idx + 1),
      sectionName: row.section_name || '',
      question: row.question || '',
      imageQuestion: row.image_question || '', // filename or base64 stored later
      imageData: null, // will be filled if image uploaded separately
      options: [
        { id: 'a', text: row.option_a || row['option a'] || '' },
        { id: 'b', text: row.option_b || row['option b'] || '' },
        { id: 'c', text: row.option_c || row['option c'] || '' },
        { id: 'd', text: row.option_d || row['option d'] || '' },
      ],
      correctAnswer: (row.correct_an || row['correct_answer'] || row['correct an'] || '').trim().toLowerCase(),
      status: 'not-visited',
      selectedAnswer: null,
      markedForReview: false,
    }));
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────*/
function CreateTest({ institute }) {
  const navigate = useNavigate();
  const csvInputRef = useRef(null);
  const imgInputRef = useRef(null);

  const [testData, setTestData] = useState({
    testName: '',
    totalQuestions: 50,
    duration: 120,
    totalMarks: 100,
    passingMarks: 40,
    description: '',
    sections: {
      sectionA: { name: 'Section A', numberOfQuestions: 20, time: 40, marksPerQuestion: 1 },
      sectionB: { name: 'Section B', numberOfQuestions: 20, time: 40, marksPerQuestion: 1 },
      sectionC: { name: 'Section C', numberOfQuestions: 10, time: 40, marksPerQuestion: 1 },
    },
  });

  // CSV / question state
  const [csvFile, setCsvFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [csvError, setCsvError] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageMap, setImageMap] = useState({}); // filename → dataURL

  /* ── Form handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTestData({
      ...testData,
      [name]: ['totalQuestions', 'duration', 'totalMarks', 'passingMarks'].includes(name)
        ? parseInt(value)
        : value,
    });
  };

  const handleSectionChange = (section, field, value) => {
    const parsed = ['numberOfQuestions', 'time', 'marksPerQuestion'].includes(field)
      ? parseInt(value) || 0
      : value;
    setTestData({
      ...testData,
      sections: {
        ...testData.sections,
        [section]: { ...testData.sections[section], [field]: parsed },
      },
    });
  };

  /* ── CSV Upload ── */
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setCsvError('Please upload a valid CSV file.');
      setCsvSuccess('');
      return;
    }
    setCsvFile(file);
    setCsvError('');
    setCsvSuccess('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const rows = parseCSV(evt.target.result);
        const parsed = csvRowsToQuestions(rows);
        if (parsed.length === 0) {
          setCsvError('CSV parsed but no questions found. Check column headers.');
          return;
        }
        setQuestions(parsed);
        setCsvSuccess(`✅ ${parsed.length} questions loaded from CSV successfully!`);
      } catch (err) {
        setCsvError('Failed to parse CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  /* ── Image Upload for questions ── */
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newMap = { ...imageMap };
    let processed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        newMap[file.name] = evt.target.result; // store as base64
        processed++;
        if (processed === files.length) {
          setImageMap({ ...newMap });
          // Attach images to matching questions
          setQuestions((prev) =>
            prev.map((q) => {
              const img = newMap[q.imageQuestion];
              return img ? { ...q, imageData: img } : q;
            })
          );
          setCsvSuccess(
            `✅ ${questions.length} questions loaded · ${files.length} image(s) attached!`
          );
        }
      };
      reader.readAsDataURL(file);
    });
  };

  /* ── Remove CSV ── */
  const handleRemoveCSV = () => {
    setQuestions([]);
    setCsvFile(null);
    setCsvSuccess('');
    setCsvError('');
    setImageMap({});
    if (csvInputRef.current) csvInputRef.current.value = '';
    if (imgInputRef.current) imgInputRef.current.value = '';
  };

  /* ── Submit / Create Test ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (questions.length === 0) {
      setCsvError('Please upload a CSV file with questions before creating the test.');
      return;
    }

    const newTest = {
      id: 'TEST-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      instituteId: institute?.id || 'INST-001',
      ...testData,
      createdAt: new Date().toLocaleDateString(),
      questions: questions,
    };

    // Save to localStorage so TestPage can read it
    try {
      // Strip imageData from questions (stored separately) to avoid localStorage quota issues
      const questionsWithoutImages = questions.map(({ imageData, ...q }) => q);
      const testWithoutImages = { ...newTest, questions: questionsWithoutImages };

      localStorage.setItem('cetTestData', JSON.stringify(testWithoutImages));
      localStorage.setItem('cetQuestions', JSON.stringify(questionsWithoutImages));
      // Save image map separately: { filename: base64DataURL }
      localStorage.setItem('cetImageMap', JSON.stringify(imageMap));
      alert(`Test "${testData.testName}" created successfully with ${questions.length} questions!`);
      navigate('/institute-dashboard');
    } catch (err) {
      alert('Storage error: ' + err.message);
    }
  };

  /* ── Section count stats ── */
  const sectionStats = questions.reduce((acc, q) => {
    const key = q.sectionName || 'General';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="form-container">
      <div className="form-box" style={{ maxWidth: '900px' }}>
        <h1>Create New CET Exam</h1>
        <form onSubmit={handleSubmit}>

          {/* ── Test Info ── */}
          <div className="form-group">
            <label htmlFor="testName">Test Name</label>
            <input
              type="text"
              id="testName"
              name="testName"
              placeholder="Enter test name"
              value={testData.testName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="totalQuestions">Total Questions</label>
              <input
                type="number"
                id="totalQuestions"
                name="totalQuestions"
                min="1"
                value={testData.totalQuestions}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="duration">Duration (minutes)</label>
              <input
                type="number"
                id="duration"
                name="duration"
                min="1"
                value={testData.duration}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="totalMarks">Total Marks</label>
              <input type="number" id="totalMarks" name="totalMarks" min="1" value={testData.totalMarks} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="passingMarks">Passing Marks</label>
              <input type="number" id="passingMarks" name="passingMarks" min="0" value={testData.passingMarks} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" placeholder="Enter test description" value={testData.description} onChange={handleChange} rows="3" />
          </div>

          {/* ── CSV Upload Section ── */}
          <div className="section-container" style={{ background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1629 100%)', border: '2px dashed #667eea', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ color: '#667eea', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📂 Upload Questions via CSV
            </h3>

            {/* CSV expected format hint */}
            <div style={{ background: 'rgba(102,126,234,0.1)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#a0aec0' }}>
              <strong style={{ color: '#667eea' }}>Expected CSV Columns:</strong>
              <br />
              <code style={{ color: '#68d391' }}>Number, Section_name, Question, Image_Question, Option A, Option B, Option C, Option D, Correct An</code>
              <br />
              <span style={{ marginTop: '4px', display: 'block' }}>
                • <strong>Image_Question</strong>: filename of the image (e.g. <code>q1.png</code>), leave blank if no image
                <br />
                • <strong>Correct An</strong>: A, B, C, or D
              </span>
            </div>

            {/* CSV file picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <label
                htmlFor="csvUpload"
                style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📋 Choose CSV File
              </label>
              <input
                ref={csvInputRef}
                id="csvUpload"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                style={{ display: 'none' }}
              />
              {csvFile && (
                <span style={{ color: '#68d391', fontSize: '14px' }}>
                  📄 {csvFile.name}
                </span>
              )}
              {csvFile && (
                <button
                  type="button"
                  onClick={handleRemoveCSV}
                  style={{
                    background: 'rgba(245,101,101,0.2)',
                    border: '1px solid #f56565',
                    color: '#f56565',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  ✕ Remove
                </button>
              )}
            </div>

            {/* Image upload (only shown after CSV loaded) */}
            {questions.length > 0 && (() => {
              const questionsWithImages = questions.filter(q => q.imageQuestion && q.imageQuestion.trim() !== '');
              return questionsWithImages.length > 0 ? (
                <div style={{ marginTop: '12px' }}>
                  <label
                    htmlFor="imgUpload"
                    style={{
                      background: 'rgba(72,187,120,0.15)',
                      border: '1px solid #48bb78',
                      color: '#68d391',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    🖼️ Upload Question Images ({questionsWithImages.length} needed)
                  </label>
                  <input
                    ref={imgInputRef}
                    id="imgUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '6px' }}>
                    Upload image files named exactly as in your CSV (e.g., <code style={{ color: '#68d391' }}>q1.png</code>)
                  </div>
                </div>
              ) : null;
            })()}

            {/* Error / Success messages */}
            {csvError && (
              <div style={{ marginTop: '12px', background: 'rgba(245,101,101,0.1)', border: '1px solid #f56565', borderRadius: '8px', padding: '10px 14px', color: '#f56565', fontSize: '14px' }}>
                ⚠️ {csvError}
              </div>
            )}
            {csvSuccess && (
              <div style={{ marginTop: '12px', background: 'rgba(72,187,120,0.1)', border: '1px solid #48bb78', borderRadius: '8px', padding: '10px 14px', color: '#68d391', fontSize: '14px' }}>
                {csvSuccess}
              </div>
            )}

            {/* Stats & Preview */}
            {questions.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                {/* Section breakdown */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  {Object.entries(sectionStats).map(([sec, cnt]) => (
                    <span
                      key={sec}
                      style={{
                        background: 'rgba(102,126,234,0.15)',
                        border: '1px solid #667eea',
                        borderRadius: '20px',
                        padding: '4px 14px',
                        fontSize: '13px',
                        color: '#a78bfa',
                      }}
                    >
                      {sec || 'General'}: <strong>{cnt}</strong> Qs
                    </span>
                  ))}
                  <span style={{ background: 'rgba(237,137,54,0.15)', border: '1px solid #ed8936', borderRadius: '20px', padding: '4px 14px', fontSize: '13px', color: '#f6ad55' }}>
                    🖼️ With images: <strong>{questions.filter(q => q.imageData).length}</strong>
                  </span>
                </div>

                {/* Preview Button */}
                <button
                  type="button"
                  onClick={() => setPreviewOpen(!previewOpen)}
                  style={{
                    background: 'rgba(102,126,234,0.15)',
                    border: '1px solid #667eea',
                    color: '#667eea',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '13px',
                  }}
                >
                  {previewOpen ? '▲ Hide Preview' : '▼ Preview Questions'}
                </button>
              </div>
            )}
          </div>

          {/* ── Question Preview ── */}
          {previewOpen && questions.length > 0 && (
            <div
              style={{
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: '12px',
                maxHeight: '400px',
                overflowY: 'auto',
                marginBottom: '20px',
                padding: '16px',
              }}
            >
              <h4 style={{ color: '#e2e8f0', marginBottom: '14px' }}>
                Question Preview ({questions.length} total)
              </h4>
              {questions.slice(0, 10).map((q) => (
                <div
                  key={q.id}
                  style={{
                    background: '#161b22',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '10px',
                    border: '1px solid #21262d',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ background: '#667eea', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>
                      {q.id}
                    </span>
                    {q.sectionName && (
                      <span style={{ background: 'rgba(102,126,234,0.2)', color: '#a78bfa', fontSize: '11px', borderRadius: '10px', padding: '1px 8px' }}>
                        {q.sectionName}
                      </span>
                    )}
                    <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{q.question}</span>
                  </div>

                  {/* Question Image Preview */}
                  {q.imageData && (
                    <div style={{ marginBottom: '8px' }}>
                      <img
                        src={q.imageData}
                        alt={`Q${q.id}`}
                        style={{ maxWidth: '200px', maxHeight: '120px', borderRadius: '6px', border: '1px solid #30363d' }}
                      />
                    </div>
                  )}
                  {q.imageQuestion && !q.imageData && (
                    <div style={{ color: '#f6ad55', fontSize: '11px', marginBottom: '6px' }}>
                      🖼️ Image file needed: <code>{q.imageQuestion}</code>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {q.options.map((opt) => (
                      <span
                        key={opt.id}
                        style={{
                          background: opt.id === q.correctAnswer ? 'rgba(72,187,120,0.15)' : 'rgba(255,255,255,0.05)',
                          border: opt.id === q.correctAnswer ? '1px solid #48bb78' : '1px solid #30363d',
                          color: opt.id === q.correctAnswer ? '#68d391' : '#a0aec0',
                          borderRadius: '6px',
                          padding: '3px 10px',
                          fontSize: '12px',
                        }}
                      >
                        <strong>{opt.id.toUpperCase()}.</strong> {opt.text}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {questions.length > 10 && (
                <div style={{ color: '#667eea', textAlign: 'center', fontSize: '13px', padding: '8px' }}>
                  ... and {questions.length - 10} more questions (showing first 10 only)
                </div>
              )}
            </div>
          )}

          {/* ── Sections ── */}
          {['sectionA', 'sectionB', 'sectionC'].map((secKey, i) => (
            <div className="section-container" key={secKey}>
              <h3>Section {['A', 'B', 'C'][i]} Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Section Name</label>
                  <input
                    type="text"
                    placeholder={['Physics / English', 'Chemistry / Mathematics', 'Biology / Reasoning'][i]}
                    value={testData.sections[secKey].name}
                    onChange={(e) => handleSectionChange(secKey, 'name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Number of Questions</label>
                  <input type="number" min="1" value={testData.sections[secKey].numberOfQuestions} onChange={(e) => handleSectionChange(secKey, 'numberOfQuestions', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Time (minutes)</label>
                  <input type="number" min="1" value={testData.sections[secKey].time} onChange={(e) => handleSectionChange(secKey, 'time', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Marks per Question</label>
                  <input type="number" min="0.25" step="0.25" value={testData.sections[secKey].marksPerQuestion} onChange={(e) => handleSectionChange(secKey, 'marksPerQuestion', e.target.value)} />
                </div>
              </div>
            </div>
          ))}

          <div className="form-buttons">
            <button type="submit" className="create-btn">
              🚀 Create Test
            </button>
            <button type="button" className="cancel-btn" onClick={() => navigate('/institute-dashboard')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTest;
