import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { testData as mockTestData } from '../data/mockData';
import QuestionPalette from './QuestionPalette';
import SubmitModal from './SubmitModal';

/* ─────────────────────────────────────────────
   Group flat question array by sectionName.
   Returns: [{ name, questions[] }, ...]
   Questions without a section go into "General".
───────────────────────────────────────────────*/
function groupBySection(questions) {
  const map = new Map();
  questions.forEach((q) => {
    const key = q.sectionName && q.sectionName.trim() !== '' ? q.sectionName.trim() : 'General';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(q);
  });
  // Re-number ids within each section from 1
  const groups = [];
  map.forEach((qs, name) => {
    groups.push({
      name,
      questions: qs.map((q, idx) => ({ ...q, sectionIndex: idx + 1 })),
    });
  });
  return groups;
}

/* ─────────────────────────────────────────────
   Per-section timer from saved test meta or
   fallback to equal shares of total duration.
───────────────────────────────────────────────*/
function getSectionDurations(testMeta, sectionCount) {
  if (!testMeta) {
    const def = Math.floor((mockTestData.duration * 60) / Math.max(sectionCount, 1));
    return Array(sectionCount).fill(def);
  }
  const secs = testMeta.sections;
  if (secs) {
    const keys = Object.keys(secs);
    return keys.slice(0, sectionCount).map((k) => (secs[k].time || 40) * 60);
  }
  const share = Math.floor((testMeta.duration || mockTestData.duration) * 60 / Math.max(sectionCount, 1));
  return Array(sectionCount).fill(share);
}

/* ─────────────────────────── Main Component ─*/
function TestPage({ student }) {
  const navigate = useNavigate();

  const [sections, setSections] = useState([]); // [{name, questions:[]}]
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0); // index within current section
  const [timeLeft, setTimeLeft] = useState(40 * 60);
  const [sectionDurations, setSectionDurations] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [sectionLocked, setSectionLocked] = useState(false); // after section submit
  const [testMeta, setTestMeta] = useState(null);
  const [allSectionsSubmitted, setAllSectionsSubmitted] = useState(false);
  const [submittedSections, setSubmittedSections] = useState([]); // indices submitted
  const [isSaved, setIsSaved] = useState(true); // track if current answer is saved

  /* ── load from localStorage ── */
  useEffect(() => {
    try {
      const savedQuestions = localStorage.getItem('cetQuestions');
      const savedTest = localStorage.getItem('cetTestData');
      const savedImageMap = localStorage.getItem('cetImageMap');

      // Parse image map: { filename -> base64DataURL }
      let imageMap = {};
      if (savedImageMap) {
        try { imageMap = JSON.parse(savedImageMap); } catch (_) { }
      }

      // Build a case-insensitive lookup for imageMap
      // Keys: lowercase filename (with and without extension) → dataURL
      const imageMapLower = {};
      Object.keys(imageMap).forEach((filename) => {
        const lower = filename.toLowerCase();
        imageMapLower[lower] = imageMap[filename];
        // Also store without extension so "Picture" matches "picture.png"
        const noExt = lower.replace(/\.[^/.]+$/, '');
        if (!imageMapLower[noExt]) imageMapLower[noExt] = imageMap[filename];
      });

      const resolveImage = (imageQuestion) => {
        if (!imageQuestion || imageQuestion.trim() === '') return null;
        const key = imageQuestion.trim().toLowerCase();
        const keyNoExt = key.replace(/\.[^/.]+$/, '');
        return imageMap[imageQuestion.trim()]        // exact match first
          || imageMapLower[key]                      // case-insensitive
          || imageMapLower[keyNoExt]                 // without extension
          || null;
      };

      let raw = [];
      if (savedQuestions) {
        raw = JSON.parse(savedQuestions);
        raw = raw.map(q => ({
          ...q,
          imageData: resolveImage(q.imageQuestion)
        }));
      } else {
        // fallback to mockData
        raw = [
          { id: 1, sectionName: 'Section A', question: 'Demo Q1 (Section A)', options: [{ id: 'a', text: 'Opt A' }, { id: 'b', text: 'Opt B' }, { id: 'c', text: 'Opt C' }, { id: 'd', text: 'Opt D' }], imageData: null, imageQuestion: '', status: 'not-visited', selectedAnswer: null, markedForReview: false },
          { id: 2, sectionName: 'Section B', question: 'Demo Q2 (Section B)', options: [{ id: 'a', text: 'Opt A' }, { id: 'b', text: 'Opt B' }, { id: 'c', text: 'Opt C' }, { id: 'd', text: 'Opt D' }], imageData: null, imageQuestion: '', status: 'not-visited', selectedAnswer: null, markedForReview: false },
        ];
      }

      const grouped = groupBySection(raw);
      setSections(grouped);

      if (savedTest) {
        const testMeta = JSON.parse(savedTest);
        setTestMeta(testMeta);
        const durs = getSectionDurations(testMeta, grouped.length);
        setSectionDurations(durs);
        if (durs.length > 0) setTimeLeft(durs[0]);
      } else {
        const durs = getSectionDurations(null, grouped.length);
        setSectionDurations(durs);
        if (durs.length > 0) setTimeLeft(durs[0]);
      }
    } catch (err) {
      console.error('Error loading test data:', err);
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (sectionLocked || allSectionsSubmitted || sections.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-submit this section
          handleSubmitSection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sectionLocked, allSectionsSubmitted, sections.length]);

  // Get current section and question
  const currentSection = sections[currentSectionIdx];
  const currentQuestion = currentSection?.questions[currentQIdx];
  const isFirstQ = currentQIdx === 0;
  const isLastQ = currentSection && currentQIdx === currentSection.questions.length - 1;
  const isFirstSection = currentSectionIdx === 0;
  const isLastSection = currentSectionIdx === sections.length - 1;

  /* ── Answer ── */
  const handleAnswerSelect = (optionId) => {
    updateQuestion((q) => ({ ...q, selectedAnswer: optionId, status: 'visited' }));
    setIsSaved(false); // mark as unsaved when answer changes
  };

  /* ── Update question in state ── */
  const updateQuestion = useCallback((updater) => {
    setSections((prevSections) => {
      const newSections = prevSections.map((sec, sIdx) => {
        if (sIdx !== currentSectionIdx) return sec;
        return {
          ...sec,
          questions: sec.questions.map((q, qIdx) => {
            if (qIdx !== currentQIdx) return q;
            return updater(q);
          }),
        };
      });
      return newSections;
    });
  }, [currentSectionIdx, currentQIdx]);

  /* ── Navigation ── */
  const handlePrev = () => {
    if (currentQIdx > 0) {
      setCurrentQIdx(currentQIdx - 1);
    }
  };

  const handleNext = () => {
    if (currentSection && currentQIdx < currentSection.questions.length - 1) {
      setCurrentQIdx(currentQIdx + 1);
    }
  };

  const handleClearResponse = () => {
    updateQuestion((q) => ({ ...q, selectedAnswer: null, status: 'visited' }));
  };

  const handleMarkForReview = () => {
    updateQuestion((q) => ({ ...q, markedForReview: !q.markedForReview }));
  };

  const handleSave = () => {
    // Save current response
    const currentQuestionData = sections[currentSectionIdx]?.questions[currentQIdx];
    if (currentQuestionData && currentQuestionData.selectedAnswer) {
      // Update status to answered and save
      setSections((prevSections) => {
        const newSections = prevSections.map((sec, sIdx) => {
          if (sIdx !== currentSectionIdx) return sec;
          return {
            ...sec,
            questions: sec.questions.map((q, qIdx) => {
              if (qIdx !== currentQIdx) return q;
              return { ...q, status: 'answered' };
            }),
          };
        });
        // Save to localStorage
        const allQuestions = newSections.flatMap(sec => sec.questions);
        localStorage.setItem('cetQuestions', JSON.stringify(allQuestions));
        return newSections;
      });
      setIsSaved(true); // mark as saved
      // Show visual feedback
      setTimeout(() => setIsSaved(false), 2000); // revert after 2 seconds
    }
  };

  const handleSelectQuestion = (questionIdx) => {
    setCurrentQIdx(questionIdx);
  };

  /* ── Submit section ── */
  const handleSubmitSection = useCallback(() => {
    // Submit this section
    setSubmittedSections((prev) => [...prev, currentSectionIdx]);
    setSectionLocked(true);

    // If it's the last section, mark all as submitted
    if (isLastSection) {
      setAllSectionsSubmitted(true);
    } else {
      // Move to next section
      setTimeout(() => {
        setCurrentSectionIdx(currentSectionIdx + 1);
        setCurrentQIdx(0);
        setSectionLocked(false);
        if (sectionDurations.length > currentSectionIdx + 1) {
          setTimeLeft(sectionDurations[currentSectionIdx + 1]);
        }
      }, 1000);
    }
  }, [currentSectionIdx, isLastSection, sectionDurations]);

  const handleConfirmSubmit = () => {
    setShowSubmitModal(false);
    handleSubmitSection();
  };

  const handleCancelSubmit = () => {
    setShowSubmitModal(false);
  };

  const handleSectionNavigate = (idx) => {
    if (idx !== currentSectionIdx) {
      setCurrentSectionIdx(idx);
      setCurrentQIdx(0);
      setShowSidebar(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (sections.length === 0) {
    return <div className="loading">Loading test...</div>;
  }

  if (allSectionsSubmitted) {
    return <TestSubmitted student={student} sections={sections} />;
  }

  return (
    <div className="test-layout">
      {/* Header with Section Tabs */}
      <div className="test-header-extended">
        <div className="test-header">
          <div className="header-title">CET Exam</div>
          <div className="section-tabs">
            {sections.map((section, idx) => (
              <button
                key={idx}
                className={`section-tab ${idx === currentSectionIdx ? 'active' : ''}`}
                onClick={() => handleSectionNavigate(idx)}
              >
                {section.name}
              </button>
            ))}
          </div>
          <div className="timer" style={{ color: timeLeft < 600 ? '#ffeb3b' : 'white' }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
          <button className="sidebar-toggle-btn" onClick={() => setShowSidebar(!showSidebar)}>
            ☰
          </button>
        </div>
      </div>

      {/* Current Section Information Card */}
      <div className="section-info-card">
        <div className="section-info-label">CURRENT SECTION</div>
        <div className="section-info-main">
          <h2 className="section-info-title">{currentSection?.name}</h2>
          <div className="section-info-questions">
            <span className="questions-label">Questions</span>
            <span className="questions-count">{currentQIdx + 1} / {currentSection?.questions.length}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', width: '100%', marginTop: '250px' }}>
        {/* Sidebar - Question Palette */}
        {showSidebar && currentSection && (
          <QuestionPalette
            questions={currentSection.questions.map((q, idx) => ({
              ...q,
              id: idx,
            }))}
            currentQuestionId={currentQIdx}
            onSelectQuestion={handleSelectQuestion}
          />
        )}

        {/* Main Test Content */}
        <div className="test-content" style={{ flex: 1, padding: '30px', overflow: 'auto' }}>
          <div className="question-container">
            {/* Question */}
            <div className="question-text">{currentQuestion?.question}</div>

            {/* Image */}
            {currentQuestion?.imageData && (
              <div className="question-image-container">
                <img
                  src={currentQuestion.imageData}
                  alt="Question"
                  className="question-image"
                />
              </div>
            )}
            {currentQuestion?.imageQuestion &&
              currentQuestion.imageQuestion.trim() !== '' &&
              !currentQuestion.imageData && (
                <div className="question-image-placeholder">
                  🖼️ Image: <strong>{currentQuestion.imageQuestion}</strong>
                </div>
              )}

            {/* Options */}
            <div className="options">
              {currentQuestion?.options.map((option, index) => {
                const label = String.fromCharCode(65 + index);
                const isSelected = currentQuestion.selectedAnswer === option.id;
                const isAnswered = isSelected && currentQuestion.status === 'answered';
                return (
                  <div
                    key={option.id}
                    className={`option ${isSelected ? 'selected' : ''} ${isAnswered ? 'answered' : ''}`}
                    style={{ opacity: sectionLocked ? 0.7 : 1 }}
                  >
                    <label>
                      <input
                        type="radio"
                        name={`q-${currentSectionIdx}-${currentQIdx}`}
                        value={option.id}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(option.id)}
                        disabled={sectionLocked}
                      />
                      <span className="option-label">{label}</span>
                      <span className="option-text">{option.text}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ NAVIGATION ═══ */}
          <div className="question-navigation">
            <button className="nav-btn" onClick={handlePrev} disabled={isFirstQ || sectionLocked}>
              ← Previous
            </button>
            <button className="nav-btn nav-action-btn clear-response-btn" onClick={handleClearResponse} disabled={sectionLocked}>
              Clear Response
            </button>
            <button
              className={`nav-btn nav-action-btn ${isSaved ? 'saved' : ''}`}
              onClick={handleSave}
              disabled={sectionLocked}
              title={isSaved ? 'Answer saved successfully' : 'Click to save'}
            >
              🔒 Save
            </button>
            <button
              className={`nav-btn nav-action-btn ${currentQuestion?.markedForReview ? 'marked' : ''}`}
              onClick={handleMarkForReview}
              disabled={sectionLocked}
            >
              Mark for Review
            </button>
            <button className="nav-btn" onClick={handleNext} disabled={isLastQ || sectionLocked}>
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <SubmitModal
          sectionName={currentSection?.name}
          onConfirm={handleConfirmSubmit}
          onCancel={handleCancelSubmit}
        />
      )}

      {/* Submit Button */}
      <button
        className="bottom-right-submit-btn"
        onClick={() => setShowSubmitModal(true)}
        disabled={sectionLocked}
      >
        Submit Section
      </button>
    </div>
  );
}

/* ── Test Submitted Page ── */
function TestSubmitted({ student, sections }) {
  return (
    <div className="submitted-box">
      <div className="submitted-content">
        <h1>✓ Test Submitted Successfully</h1>
        <p>Thank you for completing the test, {student?.name || 'Student'}!</p>
        <div className="submitted-details">
          <p><strong>Roll Number:</strong> {student?.rollNumber || 'N/A'}</p>
          <p><strong>Total Sections:</strong> {sections.length}</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default TestPage;
