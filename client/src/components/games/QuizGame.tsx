import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  Star, 
  Zap,
  Brain,
  Target,
  Award,
  Timer,
  RotateCcw
} from 'lucide-react';
import Button from '../ui/Button';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'code' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeLimit?: number; // in seconds
}

interface QuizGameProps {
  questions: QuizQuestion[];
  title: string;
  description?: string;
  timeLimit?: number; // total time in seconds
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
}

interface QuizResult {
  score: number;
  totalPoints: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  accuracy: number;
  results: QuestionResult[];
}

interface QuestionResult {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  points: number;
  timeSpent: number;
}

const QuizGame: React.FC<QuizGameProps> = ({
  questions,
  title,
  description,
  timeLimit,
  onComplete,
  onExit
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit || 0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState<{ [key: string]: number }>({});
  const [gameStartTime] = useState(Date.now());
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Timer effect
  useEffect(() => {
    if (timeLimit && timeRemaining > 0 && !showResult) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleQuizComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, showResult, timeLimit]);

  // Question timer
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleAnswerSubmit = () => {
    const timeSpent = Date.now() - questionStartTime;
    
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer
    }));

    setQuestionTimes(prev => ({
      ...prev,
      [currentQuestion.id]: timeSpent
    }));

    if (currentQuestion.explanation) {
      setShowExplanation(true);
    } else {
      handleNextQuestion();
    }
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    setSelectedAnswer('');
    
    if (isLastQuestion) {
      handleQuizComplete();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleQuizComplete = () => {
    const totalTimeSpent = Date.now() - gameStartTime;
    let totalScore = 0;
    let correctCount = 0;
    let totalPoints = 0;

    const results: QuestionResult[] = questions.map(question => {
      const userAnswer = userAnswers[question.id] || '';
      const isCorrect = userAnswer === question.correctAnswer;
      const points = isCorrect ? question.points : 0;
      
      totalScore += points;
      totalPoints += question.points;
      if (isCorrect) correctCount++;

      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points,
        timeSpent: questionTimes[question.id] || 0
      };
    });

    const quizResult: QuizResult = {
      score: totalScore,
      totalPoints,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      timeSpent: totalTimeSpent,
      accuracy: (correctCount / questions.length) * 100,
      results
    };

    setResult(quizResult);
    setShowResult(true);
    onComplete(quizResult);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-100';
      case 'medium': return 'text-yellow-500 bg-yellow-100';
      case 'hard': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getScoreColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-500';
    if (accuracy >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (showResult && result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto p-6 space-y-6"
      >
        {/* Results Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="p-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
              <Trophy className="h-12 w-12" />
            </div>
          </motion.div>
          
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-foreground"
          >
            Quiz Complete!
          </motion.h2>
          
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground"
          >
            Here's how you performed
          </motion.p>
        </div>

        {/* Score Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="card p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(result.accuracy)}`}>
              {result.score}
            </div>
            <div className="text-sm text-muted-foreground">Points</div>
          </div>
          
          <div className="card p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(result.accuracy)}`}>
              {result.accuracy.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
          
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {result.correctAnswers}/{result.totalQuestions}
            </div>
            <div className="text-sm text-muted-foreground">Correct</div>
          </div>
          
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {formatTime(Math.floor(result.timeSpent / 1000))}
            </div>
            <div className="text-sm text-muted-foreground">Time</div>
          </div>
        </motion.div>

        {/* Detailed Results */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Question Results
          </h3>
          
          <div className="space-y-4">
            {result.results.map((questionResult, index) => (
              <div
                key={questionResult.questionId}
                className={`p-4 rounded-lg border-l-4 ${
                  questionResult.isCorrect 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {questionResult.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">Question {index + 1}</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {questionResult.question}
                    </p>
                    
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="font-medium">Your answer: </span>
                        <span className={questionResult.isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {questionResult.userAnswer || 'No answer'}
                        </span>
                      </div>
                      {!questionResult.isCorrect && (
                        <div>
                          <span className="font-medium">Correct answer: </span>
                          <span className="text-green-600">{questionResult.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      questionResult.isCorrect ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {questionResult.points} pts
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(Math.floor(questionResult.timeSpent / 1000))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center space-x-4"
        >
          <Button
            variant="outline"
            onClick={onExit}
            icon={<RotateCcw className="h-4 w-4" />}
          >
            Back to Games
          </Button>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            icon={<Zap className="h-4 w-4" />}
          >
            Play Again
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {timeLimit && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span className={timeRemaining < 60 ? 'text-red-500 font-bold' : ''}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
          
          <Button variant="outline" size="sm" onClick={onExit}>
            Exit Quiz
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <motion.div
            className="bg-primary-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="card p-6 space-y-6"
        >
          {/* Question Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                    {currentQuestion.difficulty}
                  </span>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <Star className="h-4 w-4" />
                    <span className="text-sm font-medium">{currentQuestion.points} pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Question */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {currentQuestion.question}
            </h3>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswerSelect(option)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        selectedAnswer === option
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-border hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedAnswer === option
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-muted-foreground'
                        }`}>
                          {selectedAnswer === option && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                        <span>{option}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['True', 'False'].map((option) => (
                    <motion.button
                      key={option}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswerSelect(option)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedAnswer === option
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-border hover:border-primary-300'
                      }`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'short_answer' && (
                <textarea
                  value={selectedAnswer}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-4 border-2 border-border rounded-lg focus:border-primary-500 focus:outline-none resize-none"
                  rows={4}
                />
              )}

              {currentQuestion.type === 'code' && (
                <textarea
                  value={selectedAnswer}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  placeholder="Write your code here..."
                  className="w-full p-4 border-2 border-border rounded-lg focus:border-primary-500 focus:outline-none font-mono text-sm resize-none"
                  rows={8}
                />
              )}
            </div>
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-start space-x-2">
                  <div className="p-1 rounded-full bg-blue-100 text-blue-600 mt-1">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Explanation</h4>
                    <p className="text-blue-800 text-sm">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Take your time</span>
            </div>
            
            <div className="space-x-3">
              {showExplanation ? (
                <Button
                  onClick={handleNextQuestion}
                  icon={isLastQuestion ? <Trophy className="h-4 w-4" /> : undefined}
                >
                  {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
                </Button>
              ) : (
                <Button
                  onClick={handleAnswerSubmit}
                  disabled={!selectedAnswer.trim()}
                  icon={<CheckCircle className="h-4 w-4" />}
                >
                  Submit Answer
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default QuizGame;