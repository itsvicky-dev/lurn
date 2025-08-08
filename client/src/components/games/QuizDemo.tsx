import React, { useState } from 'react';
import QuizGame from './QuizGame';
import Button from '../ui/Button';
import { Play, RotateCcw } from 'lucide-react';

// Sample quiz data for demonstration
const sampleQuestions = [
  {
    id: 'q1',
    question: 'What is the correct way to declare a variable in JavaScript?',
    type: 'multiple_choice' as const,
    options: ['var myVar = 5;', 'variable myVar = 5;', 'int myVar = 5;', 'declare myVar = 5;'],
    correctAnswer: 'var myVar = 5;',
    explanation: 'In JavaScript, you can declare variables using var, let, or const keywords.',
    difficulty: 'easy' as const,
    points: 10
  },
  {
    id: 'q2',
    question: 'Which of the following is NOT a JavaScript data type?',
    type: 'multiple_choice' as const,
    options: ['String', 'Boolean', 'Integer', 'Object'],
    correctAnswer: 'Integer',
    explanation: 'JavaScript has Number type, but not specifically Integer. All numbers are of type Number.',
    difficulty: 'medium' as const,
    points: 20
  },
  {
    id: 'q3',
    question: 'What does the === operator do in JavaScript?',
    type: 'multiple_choice' as const,
    options: [
      'Assigns a value to a variable',
      'Compares values only',
      'Compares both value and type',
      'Performs mathematical addition'
    ],
    correctAnswer: 'Compares both value and type',
    explanation: 'The === operator performs strict equality comparison, checking both value and type.',
    difficulty: 'medium' as const,
    points: 20
  },
  {
    id: 'q4',
    question: 'True or False: JavaScript is a statically typed language.',
    type: 'true_false' as const,
    options: ['True', 'False'],
    correctAnswer: 'False',
    explanation: 'JavaScript is a dynamically typed language, meaning variable types are determined at runtime.',
    difficulty: 'easy' as const,
    points: 10
  },
  {
    id: 'q5',
    question: 'What is the time complexity of accessing an element in an array by index?',
    type: 'multiple_choice' as const,
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
    correctAnswer: 'O(1)',
    explanation: 'Array access by index is constant time O(1) because arrays store elements in contiguous memory locations.',
    difficulty: 'hard' as const,
    points: 30
  }
];

const QuizDemo: React.FC = () => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  const handleStartQuiz = () => {
    setShowQuiz(true);
    setQuizResult(null);
  };

  const handleQuizComplete = (result: any) => {
    setQuizResult(result);
    setShowQuiz(false);
  };

  const handleResetDemo = () => {
    setShowQuiz(false);
    setQuizResult(null);
  };

  if (showQuiz) {
    return (
      <QuizGame
        questions={sampleQuestions}
        title="JavaScript Fundamentals Quiz"
        description="Test your knowledge of JavaScript basics"
        timeLimit={300} // 5 minutes
        onComplete={handleQuizComplete}
        onExit={() => setShowQuiz(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Enhanced Quiz System Demo</h1>
        <p className="text-muted-foreground">
          Experience the new quiz system with detailed results, explanations, and progress tracking
        </p>
      </div>

      {!quizResult ? (
        <div className="card p-8 text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">JavaScript Fundamentals Quiz</h2>
            <p className="text-muted-foreground">
              5 questions covering JavaScript basics, data types, and algorithms
            </p>
            <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
              <span>⏱️ 5 minutes</span>
              <span>📝 5 questions</span>
              <span>⭐ Up to 90 points</span>
            </div>
          </div>
          
          <Button
            onClick={handleStartQuiz}
            size="lg"
            icon={<Play className="h-5 w-5" />}
          >
            Start Quiz
          </Button>
        </div>
      ) : (
        <div className="card p-8 text-center space-y-6">
          <h2 className="text-2xl font-semibold">Quiz Completed!</h2>
          <div className="space-y-4">
            <div className="text-4xl font-bold text-primary-600">
              {quizResult.score} / {quizResult.totalPoints}
            </div>
            <div className="text-lg text-muted-foreground">
              {quizResult.accuracy.toFixed(1)}% Accuracy
            </div>
            <div className="text-sm text-muted-foreground">
              {quizResult.correctAnswers} out of {quizResult.totalQuestions} questions correct
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleResetDemo}
              variant="outline"
              icon={<RotateCcw className="h-4 w-4" />}
            >
              Reset Demo
            </Button>
            <Button
              onClick={handleStartQuiz}
              icon={<Play className="h-4 w-4" />}
            >
              Take Again
            </Button>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Enhanced Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-green-600">✅ What's New</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Detailed score breakdown with visual indicators</li>
              <li>• Question-by-question results with explanations</li>
              <li>• Performance badges and motivational feedback</li>
              <li>• Time tracking per question and overall</li>
              <li>• Smart retry suggestions based on performance</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-600">📊 Result Display</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Correct answers highlighted in green</li>
              <li>• Wrong answers shown in red with correct answer</li>
              <li>• Explanations for better understanding</li>
              <li>• Progress bar showing completion percentage</li>
              <li>• Study tips for improvement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDemo;