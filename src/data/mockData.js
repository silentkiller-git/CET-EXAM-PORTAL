export const testData = {
  examName: 'CET Exam',
  duration: 120, // in minutes
  totalQuestions: 100,
  marksPerQuestion: 1,
  negativeMarking: false,
};

export const generateQuestions = () => {
  const questions = [];
  for (let i = 1; i <= 100; i++) {
    questions.push({
      id: i,
      question: `Question ${i}: Which of the following is the correct answer for this multiple choice question?`,
      options: [
        { id: 'a', text: `Option A for Question ${i}` },
        { id: 'b', text: `Option B for Question ${i}` },
        { id: 'c', text: `Option C for Question ${i}` },
        { id: 'd', text: `Option D for Question ${i}` },
      ],
      correctAnswer: 'a',
      status: 'not-visited', // not-visited, visited, answered
      selectedAnswer: null,
    });
  }
  return questions;
};

export const instructionsData = {
  general: [
    'This examination is conducted online in a single sitting of 120 minutes.',
    'The test contains 100 multiple choice questions.',
    'Each question carries equal marks.',
    `You will get a total score of 100 marks (${100} marks for each question).`,
  ],
  rules: [
    'Once you submit the test, it cannot be reattempted.',
    'Please ensure a stable internet connection throughout the test.',
    'Close all other applications and browser tabs before starting.',
    'Do not refresh the page during the examination.',
    'Use a modern web browser for the best experience.',
  ],
  navigation: [
    'Use the Question Palette on the right to navigate between questions.',
    'Green indicates answered questions.',
    'Red indicates visited but unanswered questions.',
    'White indicates unvisited questions.',
    'You can move to any question at any time.',
  ],
  marking: [
    'There is no negative marking for incorrect answers.',
    'Each correct answer will award you one mark.',
    'You can change your answer before final submission.',
    'Make sure to submit your test before time runs out.',
  ],
};
