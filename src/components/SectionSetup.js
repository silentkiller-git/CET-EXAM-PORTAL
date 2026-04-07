import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchExamSections, createSection, updateSection, deleteSection, 
  fetchAdminQuestions, addQuestion, updateQuestion, mediaUrl 
} from '../api/client';
import '../styles/QuestionUpload.css';

function SectionSetup() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [sections, setSections] = useState([]);
  const [questionsBySection, setQuestionsBySection] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [savingSection, setSavingSection] = useState({});
  const [savingAllQuestions, setSavingAllQuestions] = useState({});
  const [previewOpenBySection, setPreviewOpenBySection] = useState({});
  const [uploadingFor, setUploadingFor] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const sects = await fetchExamSections(examId);
      setSections(sects);
      
      const qs = await fetchAdminQuestions(examId);
      const qMap = {};
      sects.forEach(s => qMap[s.id] = []);
      qs.forEach(q => {
        if (!qMap[q.section_id]) qMap[q.section_id] = [];
        qMap[q.section_id].push(q);
      });
      // Sorting by order_index
      Object.keys(qMap).forEach(k => qMap[k].sort((a,b) => a.order_index - b.order_index));
      setQuestionsBySection(qMap);
      
      const exp = {};
      sects.forEach(s => exp[s.id] = true);
      setExpandedSections(exp);

      const previewState = {};
      sects.forEach(s => previewState[s.id] = false);
      setPreviewOpenBySection(previewState);
      
    } catch (err) {
      setError(err.message || 'Failed to load exam setup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [examId]);

  const handleCreateSectionLocal = () => {
    const newId = 'draft_' + Date.now();
    setSections([...sections, {
      id: newId, 
      name: 'New Section', 
      marks_per_question: 1, 
      negative_marks_per_wrong_answer: 0,
      expected_question_count: 10,
      order_index: sections.length,
      isDraft: true
    }]);
    setExpandedSections(prev => ({ ...prev, [newId]: true }));
    setQuestionsBySection(prev => ({ ...prev, [newId]: [] }));
    setPreviewOpenBySection(prev => ({ ...prev, [newId]: false }));
  };

  const handleUpdateSectionLocal = (id, key, value) => {
    setSections(sections.map(s => s.id === id ? { ...s, [key]: value } : s));
  };

  const handleSaveSection = async (section) => {
    setSavingSection(prev => ({ ...prev, [section.id]: true }));
    try {
      const payload = {
        name: section.name,
        marks_per_question: Number(section.marks_per_question),
        negative_marks_per_wrong_answer: Number(section.negative_marks_per_wrong_answer),
        expected_question_count: Number(section.expected_question_count),
        order_index: Number(section.order_index),
      };

      if (section.isDraft) {
        const created = await createSection(examId, payload);
        // Replace draft with real
        setSections(sections.map(s => s.id === section.id ? created : s));
        const questions = questionsBySection[section.id] || [];
        setQuestionsBySection(prev => {
          const next = { ...prev, [created.id]: questions };
          delete next[section.id];
          return next;
        });
        setExpandedSections(prev => {
          const next = { ...prev, [created.id]: prev[section.id] };
          delete next[section.id];
          return next;
        });
        setPreviewOpenBySection(prev => {
          const next = { ...prev, [created.id]: prev[section.id] || false };
          delete next[section.id];
          return next;
        });
      } else {
        const updated = await updateSection(examId, section.id, payload);
        setSections(sections.map(s => s.id === section.id ? updated : s));
      }
    } catch (err) {
      alert('Failed to save section: ' + err.message);
    } finally {
      setSavingSection(prev => ({ ...prev, [section.id]: false }));
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm("Delete this section and all its questions?")) return;
    const s = sections.find(x => x.id === id);
    if (!s.isDraft) {
      try {
        await deleteSection(examId, id);
      } catch (err) {
        alert("Delete failed: " + err.message);
        return;
      }
    }
    setSections(sections.filter(x => x.id !== id));
    setPreviewOpenBySection(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleUploadImages = async (sectionId, e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingFor(sectionId);
    try {
      let qList = [...(questionsBySection[sectionId] || [])];
      for (let file of files) {
        const formData = new FormData();
        formData.append("exam_id", examId);
        formData.append("section_id", sectionId);
        formData.append("question_image", file);
        formData.append("correct_option", 1);
        formData.append("difficulty", "medium");
        
        const newQ = await addQuestion(formData);
        qList.push(newQ);
      }
      setQuestionsBySection(prev => ({ ...prev, [sectionId]: qList }));
    } catch (err) {
      alert("Image upload failed: " + err.message);
    } finally {
      setUploadingFor(null);
      e.target.value = null; // reset input
    }
  };

  const handleUpdateQuestionLocal = (sectionId, qIndex, field, value) => {
    const list = [...(questionsBySection[sectionId] || [])];
    list[qIndex] = { ...list[qIndex], [field]: value };
    setQuestionsBySection(prev => ({ ...prev, [sectionId]: list }));
  };

  const handleSaveAllQuestions = async (sectionId) => {
    const qList = questionsBySection[sectionId] || [];
    if (!qList.length) {
      alert('No questions available to save in this section.');
      return;
    }

    const hasMissingData = qList.some(q => ![1, 2, 3, 4].includes(Number(q.correct_option)));
    if (hasMissingData) {
      alert('Please choose a valid correct option (A/B/C/D) for every question before saving.');
      return;
    }

    setSavingAllQuestions(prev => ({ ...prev, [sectionId]: true }));
    try {
      await Promise.all(
        qList.map((q) => {
          const payload = {
            correct_option: Number(q.correct_option),
          };
          return updateQuestion(q.id, payload);
        })
      );
      alert(`All ${qList.length} questions saved for this section.`);
    } catch (err) {
      alert('Save all failed: ' + err.message);
    } finally {
      setSavingAllQuestions(prev => ({ ...prev, [sectionId]: false }));
    }
  };

  const getCorrectOptionLabel = (correctOption) => {
    const mapping = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    return mapping[Number(correctOption)] || '-';
  };

  const getStatusBadge = (section) => {
    const qList = questionsBySection[section.id] || [];
    if (!qList.length) return <span style={{ color: 'red', fontWeight: 'bold' }}>🔴 Incomplete</span>;
    
    // Check if we have expected count
    if (qList.length !== section.expected_question_count) {
      return <span style={{ color: 'orange', fontWeight: 'bold' }}>🟡 Partial (Count Mismatch)</span>;
    }

    return <span style={{ color: 'green', fontWeight: 'bold' }}>🟢 Ready</span>;
  };

  return (
    <div className="question-upload-container">
      <div className="upload-box" style={{ maxWidth: 1000 }}>
        <h1>📑 Sections Configuration</h1>
        <p className="subtitle">Configure exam sections, set marks, and upload question images in strict sequential order.</p>
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? <p>Loading sections...</p> : (
          <div style={{ marginTop: 20 }}>
            {sections.map((section, sIndex) => {
              const qList = questionsBySection[section.id] || [];
              const isExpanded = expandedSections[section.id];

              return (
                <div key={section.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 15, marginBottom: 20, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !isExpanded }))}>
                    <h3 style={{ margin: 0 }}>
                      {isExpanded ? '▼' : '►'} Section {sIndex + 1}: {section.name || 'Unnamed Section'}
                    </h3>
                    <div>
                      <span style={{ marginRight: 15 }}>{getStatusBadge(section)}</span>
                      {!section.isDraft && <button className="btn btn-cancel" onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}>Delete</button>}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 15, padding: 15, background: '#f8f9fa', borderRadius: 6 }}>
                      <div className="form-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Section Name</label>
                          <input type="text" value={section.name} onChange={e => handleUpdateSectionLocal(section.id, 'name', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Expected Questions</label>
                          <input type="number" value={section.expected_question_count} onChange={e => handleUpdateSectionLocal(section.id, 'expected_question_count', Number(e.target.value))} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Marks Per Question</label>
                          <input type="number" step="0.5" value={section.marks_per_question} onChange={e => handleUpdateSectionLocal(section.id, 'marks_per_question', Number(e.target.value))} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Negative Marks (Per Wrong Answer)</label>
                          <input type="number" step="0.25" value={section.negative_marks_per_wrong_answer} onChange={e => handleUpdateSectionLocal(section.id, 'negative_marks_per_wrong_answer', Number(e.target.value))} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Order Index</label>
                          <input type="number" value={section.order_index} onChange={e => handleUpdateSectionLocal(section.id, 'order_index', Number(e.target.value))} />
                        </div>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <button className="btn btn-primary" onClick={() => handleSaveSection(section)} disabled={savingSection[section.id]}>
                          {savingSection[section.id] ? 'Saving...' : 'Save Section Settings'}
                        </button>
                      </div>

                      {!section.isDraft && (
                        <div style={{ marginTop: 25, padding: 15, border: '2px dashed #7c3aed', borderRadius: 8, background: '#f5f3ff' }}>
                          <label style={{ fontWeight: 'bold' }}>📸 Upload Question Images for {section.name}</label>
                          <p style={{ margin: '5px 0 10px 0', fontSize: '0.9rem', color: '#666' }}>
                            Upload image files. Each image will be appended as a question.
                          </p>
                          <input type="file" multiple accept="image/*" onChange={(e) => handleUploadImages(section.id, e)} disabled={uploadingFor === section.id} />
                          {uploadingFor === section.id && <span style={{ marginLeft: 10 }}>Uploading...</span>}
                        </div>
                      )}

                      {!section.isDraft && qList.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                          <h4>Questions ({qList.length} uploaded)</h4>
                          {qList.map((q, qIndex) => (
                            <div key={q.id || qIndex} style={{ display: 'flex', gap: 15, borderBottom: '1px solid #ddd', paddingBottom: 15, marginBottom: 15 }}>
                              <div>
                                <strong>Q{qIndex + 1}</strong>
                                {q.question_image_path && (
                                  <div style={{ marginTop: 5 }}>
                                    <img src={mediaUrl(q.question_image_path)} alt={`Q${qIndex + 1}`} style={{ height: 100, border: '1px solid #ccc', borderRadius: 4 }} />
                                  </div>
                                )}
                              </div>
                              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                  <label>Correct Option</label>
                                  <select value={q.correct_option} onChange={e => handleUpdateQuestionLocal(section.id, qIndex, 'correct_option', Number(e.target.value))} style={{ padding: '8px', width: '100%', borderRadius: 4, border: '1px solid #ccc' }}>
                                    <option value={1}>A</option>
                                    <option value={2}>B</option>
                                    <option value={3}>C</option>
                                    <option value={4}>D</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}

                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleSaveAllQuestions(section.id)}
                              disabled={savingAllQuestions[section.id]}
                            >
                              {savingAllQuestions[section.id] ? 'Saving All...' : `Save All Questions (${qList.length})`}
                            </button>
                            <button
                              className="btn btn-info"
                              style={{ width: 'auto', textAlign: 'center' }}
                              onClick={() => setPreviewOpenBySection(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                            >
                              {previewOpenBySection[section.id] ? 'Hide Preview' : 'Preview Answers'}
                            </button>
                          </div>

                          {previewOpenBySection[section.id] && (
                            <div style={{ marginTop: 15, background: '#f1f5f9', borderRadius: 8, border: '1px solid #dbe2ea', padding: 12 }}>
                              <h5 style={{ margin: '0 0 12px 0' }}>Section Preview: {section.name}</h5>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                {qList.map((q, qIndex) => (
                                  <div key={`preview_${q.id || qIndex}`} style={{ background: '#fff', border: '1px solid #d6dde6', borderRadius: 8, padding: 10 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Q{qIndex + 1}</div>
                                    {q.question_image_path ? (
                                      <img
                                        src={mediaUrl(q.question_image_path)}
                                        alt={`Preview Q${qIndex + 1}`}
                                        style={{ width: '100%', height: 110, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', marginBottom: 8 }}
                                      />
                                    ) : (
                                      <div style={{ height: 110, border: '1px dashed #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', marginBottom: 8 }}>
                                        No Image
                                      </div>
                                    )}
                                    <div style={{ fontSize: 14 }}>
                                      Correct Answer: <strong>{getCorrectOptionLabel(q.correct_option)}</strong>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ marginTop: 20 }}>
              <button className="btn btn-primary" onClick={handleCreateSectionLocal} style={{ width: '100%', padding: 15 }}>
                + Add Section
              </button>
            </div>

            <div style={{ marginTop: 40, borderTop: '2px solid #ccc', paddingTop: 20, textAlign: 'right' }}>
               <button className="btn btn-primary" onClick={() => navigate('/institute-dashboard')} style={{ padding: '15px 30px' }}>
                 Back to Dashboard
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SectionSetup;
