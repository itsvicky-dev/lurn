import React from 'react';
import QuizGame from './QuizGame';
import { Quiz, QuizResult as ApiQuizResult, QuizQuestionResult as ApiQuizQuestionResult } from '../../types';

interface EnhancedQuizGameProps {
  quiz: Quiz;
  title: string;
  description?: string;
  timeLimit?: number;
  onComplete: (result: ApiQuizResult) => void;
  onExit: () => void;
}

// Convert our enhanced quiz format to the API format
const convertToApiResult = (
  enhancedResult: any,
  passingScore: number
): ApiQuizResult => {
  return {
    score: Math.round((enhancedResult.correctAnswers / enhancedResult.totalQuestions) * 100),
    passed: enhancedResult.accuracy >= passingScore,
    correctAnswers: enhancedResult.correctAnswers,
    totalQuestions: enhancedResult.totalQuestions,
    results: enhancedResult.results.map((result: any, index: number): ApiQuizQuestionResult => ({
      questionIndex: index,
      question: result.question,
      userAnswer: result.userAnswer,
      correctAnswer: result.correctAnswer,
      isCorrect: result.isCorrect,
      explanation: result.explanation
    }))
  };
};

// Convert API quiz format to our enhanced format
const convertQuizFormat = (quiz: Quiz) => {
  return quiz.questions.map((question, index) => ({
    id: `question-${index}`,
    question: question.question,
    type: question.type,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    difficulty: question.difficulty,
    points: question.difficulty === 'easy' ? 10 : question.difficulty === 'medium' ? 20 : 30,
    timeLimit: undefined // Can be added if needed
  }));
};

const EnhancedQuizGame: React.FC<EnhancedQuizGameProps> = ({
  quiz,
  title,
  description,
  timeLimit,
  onComplete,
  onExit
}) => {
  const enhancedQuestions = convertQuizFormat(quiz);

  const handleComplete = (result: any) => {
    const apiResult = convertToApiResult(result, quiz.passingScore);
    onComplete(apiResult);
  };

  return (
    <QuizGame
      questions={enhancedQuestions}
      title={title}
      description={description}
      timeLimit={timeLimit}
      onComplete={handleComplete}
      onExit={onExit}
    />
  );
};

export default EnhancedQuizGame;