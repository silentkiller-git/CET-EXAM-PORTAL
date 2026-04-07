import React, { useState, useMemo } from 'react';

function QuestionPalette({ questions, currentQuestionId, onSelectQuestion }) {
  const [activeTab, setActiveTab] = useState('palette'); // 'palette' or 'instructions'

  // Calculate question statistics
  const stats = useMemo(() => {
    const answered = questions.filter(q => q.status === 'answered').length;
    const notAnswered = questions.filter(q => q.status === 'not-answered' || !q.status).length;
    const markedForReview = questions.filter(q => q.markedForReview).length;
    return { total: questions.length, answered, notAnswered, markedForReview };
  }, [questions]);

  return (
    <div className="palette-sidebar">
      {/* Header Tabs */}
      <div className="palette-header-tabs">
        <button
          className={`palette-tab-btn ${activeTab === 'palette' ? 'active' : ''}`}
          onClick={() => setActiveTab('palette')}
        >
          Palette
        </button>
        <button
          className={`palette-tab-btn ${activeTab === 'instructions' ? 'active' : ''}`}
          onClick={() => setActiveTab('instructions')}
        >
          Info
        </button>
      </div>

      {/* Question Palette Tab */}
      {activeTab === 'palette' && (
        <div className="palette-content">
          {/* Question Stats */}
          <div className="palette-stats">
            <div className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Ans:</span>
              <span className="stat-value" style={{ color: '#10b981' }}>{stats.answered}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Rev:</span>
              <span className="stat-value" style={{ color: '#f59e0b' }}>{stats.markedForReview}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="palette-legend">
            <div className="legend-row">
              <div className="legend-box answered"></div>
              <span>Answered</span>
            </div>
            <div className="legend-row">
              <div className="legend-box not-answered"></div>
              <span>Not Answered</span>
            </div>
            <div className="legend-row">
              <div className="legend-box marked-review"></div>
              <span>Review</span>
            </div>
          </div>

          {/* Question Grid */}
          <div className="palette-questions">
            {questions.map((question) => {
              let statusClass = 'not-answered';
              if (question.markedForReview) {
                statusClass = 'marked-review';
              } else if (question.status === 'answered') {
                statusClass = 'answered';
              }

              const isCurrent = question.id === currentQuestionId;

              return (
                <button
                  key={question.id}
                  className={`palette-btn ${statusClass} ${isCurrent ? 'current' : ''}`}
                  onClick={() => onSelectQuestion(question.id)}
                  title={`Question ${question.id}${question.markedForReview ? ' (Marked for Review)' : ''}`}
                >
                  {question.id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions Tab */}
      {activeTab === 'instructions' && (
        <div className="palette-content instructions-tab">
          <div className="instructions-content">
            <h3>General Instructions</h3>
            <ol>
              <li>Read carefully</li>
              <li>Don't refresh</li>
              <li>Auto-saved</li>
              <li>Use palette to navigate</li>
            </ol>
          </div>
          <div style={{ marginTop: 20 }}>
            <button className="report-issue-btn">Report Issue</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionPalette;
