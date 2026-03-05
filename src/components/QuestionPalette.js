import React from 'react';

function QuestionPalette({ questions, currentQuestionId, onSelectQuestion }) {
  return (
    <div className="palette-wrapper">
      <div className="palette-title">Questions Navigator</div>

      <div className="palette-legend">
        <div className="legend-item">
          <div className="legend-box not-visited"></div>
          <span>Not Visited</span>
        </div>
        <div className="legend-item">
          <div className="legend-box clear-response"></div>
          <span>Clear Response</span>
        </div>
        <div className="legend-item">
          <div className="legend-box answered"></div>
          <span>Answered</span>
        </div>
        <div className="legend-item">
          <div className="legend-box marked-review"></div>
          <span>Mark for Review</span>
        </div>
      </div>

      <div className="palette-questions">
        {questions.map((question) => {
          let statusClass = 'not-visited';
          if (question.markedForReview) {
            statusClass = 'marked-review';
          } else if (question.status === 'answered') {
            statusClass = 'answered';
          } else if (question.status === 'visited') {
            statusClass = 'clear-response';
          }

          const isCurrent = question.id === currentQuestionId;

          return (
            <button
              key={question.id}
              className={`palette-btn ${statusClass} ${isCurrent ? 'current' : ''}`}
              onClick={() => onSelectQuestion(question.id)}
              title={`Question ${question.id}`}
            >
              {question.id}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuestionPalette;
