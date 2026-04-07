import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestionPalette from './QuestionPalette';
import SubmitModal from './SubmitModal';
import {
  fetchExamQuestions,
  fetchStudentSections,
  fetchTimer,
  mediaUrl,
  saveAnswer,
  startExam,
  submitExam,
} from '../api/client';

function TestPage({ student }) {
  const navigate = useNavigate();
  const submitRequestedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exam, setExam] = useState(null);
  const [attemptId, setAttemptId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasActiveAttempt, setHasActiveAttempt] = useState(false);
  const [answerState, setAnswerState] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState({});
  const [sectionTimeSpent, setSectionTimeSpent] = useState({});

  const currentSection = sections[currentSectionIndex] || null;
  const sectionQuestions = useMemo(() => {
    if (!currentSection) return [];
    return questions.filter(q => q.section_id === currentSection.id);
  }, [questions, currentSection]);

  const currentQuestion = sectionQuestions[currentQuestionIndex] || null;
  const attemptStorageKey = attemptId ? `cet_attempt_state_${attemptId}` : '';

  const sectionQuestionStats = useMemo(() => {
    const map = {};
    sections.forEach((section) => {
      const sectionQs = questions.filter((q) => q.section_id === section.id);
      let answered = 0;
      let review = 0;
      sectionQs.forEach((q) => {
        const state = answerState[q.id];
        if (state?.selected_option != null) answered += 1;
        if (state?.marked_for_review) review += 1;
      });
      map[section.id] = {
        total: sectionQs.length,
        answered,
        review,
      };
    });
    return map;
  }, [sections, questions, answerState]);

  const markedReviewQuestionNumbers = useMemo(() => {
    return sectionQuestions
      .map((q, idx) => ({ idx: idx + 1, marked: !!answerState[q.id]?.marked_for_review }))
      .filter((x) => x.marked)
      .map((x) => x.idx);
  }, [sectionQuestions, answerState]);

  const buildQuestionStatus = (q) => {
    const a = answerState[q.id];
    if (!a && !visitedQuestions[q.id]) return 'not-visited';
    if (!a) return 'clear-response';
    if (a.marked_for_review) return 'marked-review';
    if (a.selected_option != null) return 'answered';
    return 'clear-response';
  };

  const answeredInSection = useMemo(() => {
    return sectionQuestions.filter(q => answerState[q.id]?.selected_option != null).length;
  }, [sectionQuestions, answerState]);

  const examId = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('cet_active_exam') || localStorage.getItem('cet_active_exam');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      setExam(parsed);
      return parsed.id;
    } catch {
      return '';
    }
  }, []);

  const persistSubmissionContext = useCallback((payload) => {
    const endTime = payload?.end_time || new Date().toISOString();
    const reason = payload?.submission_reason || 'manual';
    const submittedStudentName = payload?.submitted_student_name || student?.name || student?.username || 'Student';
    const context = {
      end_time: endTime,
      submission_reason: reason,
      submitted_student_name: submittedStudentName,
      section_time_spent: sectionTimeSpent,
    };
    sessionStorage.setItem('cet_submission_time', endTime);
    sessionStorage.setItem('cet_submission_reason', reason);
    sessionStorage.setItem('cet_submitted_student_name', submittedStudentName);
    sessionStorage.setItem('cet_section_time_spent', JSON.stringify(sectionTimeSpent));
    sessionStorage.setItem('cet_submission_context', JSON.stringify(context));
    localStorage.setItem('cet_submission_context', JSON.stringify(context));
  }, [sectionTimeSpent, student]);

  const handleSubmit = useCallback(async (reason = 'manual') => {
    if (submitRequestedRef.current || submitting || !examId || !attemptId) return;
    submitRequestedRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const result = await submitExam(examId, {
        reason,
        section_time_spent: sectionTimeSpent,
      });
      persistSubmissionContext(result);
      if (attemptStorageKey) {
        localStorage.removeItem(attemptStorageKey);
      }
      navigate('/submitted');
    } catch (err) {
      setError(err.message || 'Submission failed');
      submitRequestedRef.current = false;
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  }, [attemptId, attemptStorageKey, examId, navigate, persistSubmissionContext, sectionTimeSpent, submitting]);

  useEffect(() => {
    if (!examId) {
      navigate('/dashboard');
      return;
    }

    let mounted = true;

    const init = async () => {
      setLoading(true);
      setError('');
      setHasActiveAttempt(false);
      try {
        const attempt = await startExam(examId);
        if (!mounted) return;
        setAttemptId(attempt.attempt_id);
        setHasActiveAttempt(true);
        sessionStorage.setItem('cet_last_attempt', attempt.attempt_id || '');

        const [qData, sData, timerData] = await Promise.all([
          fetchExamQuestions(examId),
          fetchStudentSections(examId),
          fetchTimer(examId)
        ]);

        if (!mounted) return;
        setQuestions(Array.isArray(qData) ? qData : []);
        setSections(sData);
        sessionStorage.setItem(
          'cet_section_name_map',
          JSON.stringify(
            (sData || []).reduce((acc, section) => {
              acc[section.id] = section.name;
              return acc;
            }, {})
          )
        );

          const sectionTimeInit = {};
          sData.forEach((s) => {
           sectionTimeInit[s.id] = 0;
          });
          setSectionTimeSpent(sectionTimeInit);
          setCurrentSectionIndex(0);
          setCurrentQuestionIndex(0);

        setTimeLeft(Math.max(0, Number(timerData.seconds_remaining || 0)));
      } catch (err) {
        if (mounted) {
          setAttemptId('');
          setHasActiveAttempt(false);
          setError(err.message || 'Failed to start exam');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [examId, navigate]);

  useEffect(() => {
    if (!attemptStorageKey || !questions.length || !sections.length) return;
    try {
      const raw = localStorage.getItem(attemptStorageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.answers && typeof saved.answers === 'object') {
        setAnswerState(saved.answers);
      }
      if (saved.visited && typeof saved.visited === 'object') {
        setVisitedQuestions(saved.visited);
      }
      if (saved.sectionTimeSpent && typeof saved.sectionTimeSpent === 'object') {
        setSectionTimeSpent((prev) => ({ ...prev, ...saved.sectionTimeSpent }));
      }
      if (Number.isInteger(saved.currentSectionIndex) && saved.currentSectionIndex >= 0 && saved.currentSectionIndex < sections.length) {
        setCurrentSectionIndex(saved.currentSectionIndex);
      }
      if (Number.isInteger(saved.currentQuestionIndex) && saved.currentQuestionIndex >= 0) {
        setCurrentQuestionIndex(saved.currentQuestionIndex);
      }
    } catch {
      // ignore malformed saved state
    }
  }, [attemptStorageKey, questions.length, sections.length]);

  useEffect(() => {
    if (!attemptStorageKey || !attemptId) return;
    const stateToSave = {
      answers: answerState,
      visited: visitedQuestions,
      sectionTimeSpent,
      currentSectionIndex,
      currentQuestionIndex,
      savedAt: Date.now(),
    };
    localStorage.setItem(attemptStorageKey, JSON.stringify(stateToSave));
  }, [answerState, attemptId, attemptStorageKey, currentQuestionIndex, currentSectionIndex, sectionTimeSpent, visitedQuestions]);

  useEffect(() => {
    if (!currentQuestion?.id) return;
    setVisitedQuestions((prev) => {
      if (prev[currentQuestion.id]) return prev;
      return { ...prev, [currentQuestion.id]: true };
    });
  }, [currentQuestion]);

  useEffect(() => {
    if (!currentSection?.id || !hasActiveAttempt || loading) return undefined;
    const interval = setInterval(() => {
      setSectionTimeSpent((prev) => ({
        ...prev,
        [currentSection.id]: (prev[currentSection.id] || 0) + 1,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSection, hasActiveAttempt, loading]);

  useEffect(() => {
    if (!examId || loading || !hasActiveAttempt || !attemptId) return undefined;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const poll = setInterval(async () => {
      try {
        const t = await fetchTimer(examId);
        setTimeLeft(Math.max(0, Number(t.seconds_remaining || 0)));
      } catch (err) {
        if ((err?.message || '').toLowerCase().includes('no active attempt') && !submitRequestedRef.current) {
          setHasActiveAttempt(false);
          persistSubmissionContext({
            end_time: new Date().toISOString(),
            submission_reason: 'timeout',
            submitted_student_name: student?.name || student?.username || 'Student',
          });
          navigate('/submitted');
        }
        if (!submitRequestedRef.current) {
          setError(err.message || 'Failed to sync timer');
        }
      }
    }, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(poll);
    };
  }, [attemptId, examId, handleSubmit, hasActiveAttempt, loading, navigate, persistSubmissionContext, student]);

  const persistAnswer = async (questionId, next) => {
    if (!attemptId) return;
    await saveAnswer({
      attempt_id: attemptId,
      question_id: questionId,
      selected_option: next.selected_option,
      marked_for_review: !!next.marked_for_review,
    });
  };

  const updateAnswer = async (questionId, patch) => {
    const current = answerState[questionId] || {
      selected_option: null,
      marked_for_review: false,
    };
    const next = { ...current, ...patch };
    setAnswerState((prev) => ({ ...prev, [questionId]: next }));
    setVisitedQuestions((prev) => ({ ...prev, [questionId]: true }));
    try {
      await persistAnswer(questionId, next);
    } catch (err) {
      setError(err.message || 'Unable to save answer');
    }
  };

  const handleSwitchSection = (index) => {
    setCurrentSectionIndex(index);
    setCurrentQuestionIndex(0);
  };

  const formatTime = (seconds) => {
    const total = Math.max(0, Number(seconds || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="loading">Loading test...</div>;
  }

  if (error && questions.length === 0) {
    return (
      <div className="exam-error-container">
        <div className="exam-error-box">
          <h2>Unable to Start Exam</h2>
          <p>{error}</p>
          <button className="exam-error-btn" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const globalQuestionNumber = questions.findIndex(q => q.id === currentQuestion?.id) + 1;

  return (
    <div className="exam-container">
      {/* HEADER */}
      <div className="exam-header">
        <div className="exam-header-left">
          <div className="exam-logo">
            <span className="exam-logo-icon">🔒</span>
            <div className="exam-logo-text">
              <div className="exam-logo-brand">SEB</div>
              <div className="exam-logo-subtitle">SECURE EXAM PORTAL</div>
            </div>
          </div>
        </div>

        <div className="exam-header-center">
          <div className="exam-timer-label">TIME REMAINING:</div>
          <div className={`exam-timer ${timeLeft < 600 ? 'warning' : ''}`}>
            {formatTime(timeLeft)}
            {timeLeft < 600 && <span className="timer-warning-icon">⚠️</span>}
          </div>
        </div>

        <div className="exam-header-right">
          <div className="exam-user-profile">
            <div className="user-avatar">👤</div>
            <div className="user-info">
              <div className="user-name">{student?.name || student?.username || 'Student'}</div>
              <div className="user-status">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="exam-main">
        {/* LEFT SIDEBAR - QUESTION PALETTE */}
        <QuestionPalette
          questions={sectionQuestions.map((q, idx) => ({
            id: idx + 1,
            status: buildQuestionStatus(q),
            markedForReview: !!answerState[q.id]?.marked_for_review,
          }))}
          currentQuestionId={currentQuestionIndex + 1}
          onSelectQuestion={(n) => setCurrentQuestionIndex(Math.max(0, n - 1))}
        />

        {/* CENTER CONTENT - QUESTION AREA */}
        <div className="exam-question-area">
          {/* Section Header */}
          {currentSection && (
            <div className="exam-section-header">
              <h2>{currentSection.name}</h2>
              <p className="section-description">
                {sectionQuestions.length} Questions
              </p>
            </div>
          )}

          {error ? <p className="exam-error-text">{error}</p> : null}

          {currentQuestion ? (
            <div className="exam-question-content">
              {/* Question Number and Label */}
              <div className="question-label">
                Question {currentQuestionIndex + 1}: Read the case study on the left and answer the question below.
              </div>

              {/* Case Study if present */}
              {currentQuestion.question_image_path && (
                <div className="question-image-box">
                  <div className="case-study-label">[Case Study: {currentSection?.name}]</div>
                  <img
                    src={mediaUrl(currentQuestion.question_image_path)}
                    alt={`Question ${currentQuestionIndex + 1}`}
                    className="question-image"
                  />
                </div>
              )}

              {/* Question Text */}
              <div className="question-text-content">
                <p>Question text: Which specific display technique was most effective according to the case study?</p>
              </div>

              {/* Options */}
              <div className="options-box">
                {[1, 2, 3, 4].map((optionNo) => {
                  const optionLabel = String.fromCharCode(64 + optionNo);
                  const selected = answerState[currentQuestion.id]?.selected_option === optionNo;
                  return (
                    <div key={optionNo} className={`option-item ${selected ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        id={`option-${currentQuestion.id}-${optionNo}`}
                        name={`q-${currentQuestion.id}`}
                        value={optionNo}
                        checked={selected}
                        onChange={() => updateAnswer(currentQuestion.id, { selected_option: optionNo })}
                      />
                      <label htmlFor={`option-${currentQuestion.id}-${optionNo}`}>
                        <span className="option-letter">{optionLabel}</span>
                        <span className="option-text">Option {optionLabel} text here</span>
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="exam-action-buttons">
                <button
                  className="exam-btn exam-btn-primary"
                  onClick={() => updateAnswer(currentQuestion.id, {
                    marked_for_review: !answerState[currentQuestion.id]?.marked_for_review,
                  })}
                  title={answerState[currentQuestion.id]?.marked_for_review ? 'Unmark for review' : 'Mark for review'}
                >
                  {answerState[currentQuestion.id]?.marked_for_review ? '✓ ' : ''}MARK FOR REVIEW & NEXT
                </button>

                <button
                  className="exam-btn exam-btn-secondary"
                  onClick={() => updateAnswer(currentQuestion.id, { selected_option: null })}
                >
                  CLEAR RESPONSE
                </button>

                <button
                  className="exam-btn exam-btn-primary"
                  disabled={currentQuestionIndex >= sectionQuestions.length - 1}
                  onClick={() => setCurrentQuestionIndex((v) => Math.min(sectionQuestions.length - 1, v + 1))}
                >
                  SAVE & NEXT
                </button>
              </div>

              {/* Navigation Buttons */}
              <div className="exam-nav-buttons">
                <button
                  className="exam-nav-btn"
                  disabled={currentQuestionIndex === 0 && currentSectionIndex === 0}
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      setCurrentQuestionIndex((v) => Math.max(0, v - 1));
                    } else if (currentSectionIndex > 0) {
                      handleSwitchSection(currentSectionIndex - 1);
                    }
                  }}
                >
                  ← PREVIOUS
                </button>

                <button
                  className="exam-nav-btn"
                  disabled={currentQuestionIndex >= sectionQuestions.length - 1 && currentSectionIndex >= sections.length - 1}
                  onClick={() => {
                    if (currentQuestionIndex < sectionQuestions.length - 1) {
                      setCurrentQuestionIndex((v) => Math.min(sectionQuestions.length - 1, v + 1));
                    } else if (currentSectionIndex < sections.length - 1) {
                      handleSwitchSection(currentSectionIndex + 1);
                    }
                  }}
                >
                  {currentSectionIndex >= sections.length - 1 && currentQuestionIndex >= sectionQuestions.length - 1
                    ? 'REVIEW ANSWERS'
                    : 'SAVE & NEXT →'}
                </button>
              </div>
            </div>
          ) : (
            <p className="no-questions-text">No questions loaded.</p>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="exam-footer">
        <div className="exam-footer-left">
          <span className="question-counter">Question {currentQuestionIndex + 1} of {sectionQuestions.length}</span>
        </div>
        <div className="exam-footer-center">
          <span className="exam-language">Language: English</span>
        </div>
        <div className="exam-footer-right">
          <span className="exam-status">Exam: {exam?.name || 'CET'}</span>
          <span className="status-indicator">Status: Active</span>
          <button
            className="exam-submit-btn"
            onClick={() => setShowSubmitModal(true)}
            disabled={submitting || !hasActiveAttempt}
          >
            {submitting ? '⏳ SUBMITTING...' : '✓ SUBMIT EXAM'}
          </button>
        </div>
      </div>

      {/* SUBMIT MODAL */}
      {showSubmitModal ? (
        <SubmitModal
          questions={questions.map((q) => ({ status: buildQuestionStatus(q) }))}
          onConfirm={() => handleSubmit('manual')}
          onCancel={() => setShowSubmitModal(false)}
        />
      ) : null}
    </div>
  );
}

export default TestPage;
