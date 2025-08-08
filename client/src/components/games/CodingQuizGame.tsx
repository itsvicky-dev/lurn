import React, { useState, useEffect, useRef } from 'react';
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
  RotateCcw,
  Code,
  Lightbulb,
  ChevronRight,
  Play,
  Square
} from 'lucide-react';
import Button from '../ui/Button';
import { CodingGame, GameSession } from '../../types';

interface CodingQuizGameProps {
  game: CodingGame;
  session: GameSession;
  isInLayout?: boolean;
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
  onSubmitSolution: (code: string, quizResults?: QuizResult) => Promise<void>;
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
  questionIndex: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  points: number;
  timeSpent: number;
  explanation?: string;
}

const CodingQuizGame: React.FC<CodingQuizGameProps> = ({
  game,
  session,
  isInLayout = false,
  onComplete,
  onExit,
  onSubmitSolution
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState(game.timeLimit || 0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState<{ [key: number]: number }>({});
  const [gameStartTime] = useState(Date.now());
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentQuestionResult, setCurrentQuestionResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null>(null);

  const questions = game.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Timer effect
  useEffect(() => {
    if (game.timeLimit && timeRemaining > 0 && !showResult) {
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
  }, [timeRemaining, showResult, game.timeLimit]);

  // Question timer
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  // Prevent component reset when session updates after completion
  useEffect(() => {
    if (session?.status === 'completed' && !quizCompleted && result) {
      setQuizCompleted(true);
      setShowResult(true);
    }
  }, [session?.status, quizCompleted, result]);

  // Check if session is already completed on mount
  useEffect(() => {
    if (session?.status === 'completed' && session.testResults && session.testResults.length > 0) {
      
      // Calculate quiz metrics from test results
      const correctAnswers = session.testResults.filter(result => result.passed).length;
      const totalQuestions = questions.length;
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      
      // Reconstruct quiz results from session data
      const reconstructedResult: QuizResult = {
        score: session.score || 0,
        totalPoints: game.points || 0,
        correctAnswers,
        totalQuestions,
        timeSpent: (session.timeSpent || 0) * 1000, // Convert back to milliseconds
        accuracy,
        results: session.testResults?.map((testResult, index) => ({
          questionIndex: index,
          question: questions[index]?.question || '',
          userAnswer: testResult.actualOutput || '',
          correctAnswer: testResult.expectedOutput || '',
          isCorrect: testResult.passed || false,
          points: testResult.passed ? (questions[index]?.points || 0) : 0,
          timeSpent: testResult.executionTime || 0,
          explanation: questions[index]?.explanation || ''
        })) || []
      };
      
      setResult(reconstructedResult);
      setQuizCompleted(true);
      setShowResult(true);
    }
  }, [session, game.points, questions]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleAnswerSubmit = () => {
    const timeSpent = Date.now() - questionStartTime;
    
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: selectedAnswer
    }));

    setQuestionTimes(prev => ({
      ...prev,
      [currentQuestionIndex]: timeSpent
    }));

    // Check if answer is correct and show immediate feedback
    const isCorrect = selectedAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
    
    setCurrentQuestionResult({
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation
    });
    
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    setShowFeedback(false);
    setCurrentQuestionResult(null);
    setSelectedAnswer('');
    
    if (isLastQuestion) {
      handleQuizComplete();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleQuizComplete = async () => {
    const totalTimeSpent = Date.now() - gameStartTime;
    let totalScore = 0;
    let correctCount = 0;
    let totalPoints = 0;

    const results: QuestionResult[] = questions.map((question, index) => {
      const userAnswer = userAnswers[index] || '';
      const isCorrect = userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
      const points = isCorrect ? question.points : 0;
      
      totalScore += points;
      totalPoints += question.points;
      if (isCorrect) correctCount++;

      return {
        questionIndex: index,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points,
        timeSpent: questionTimes[index] || 0,
        explanation: question.explanation
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

    setQuizCompleted(true);
    setResult(quizResult);
    setShowResult(true);
    
    // Submit the quiz result with proper quiz data
    try {
      setIsSubmitting(true);
      const quizCode = `// Quiz Results
// Score: ${quizResult.score}/${quizResult.totalPoints}
// Accuracy: ${quizResult.accuracy.toFixed(1)}%
// Time: ${Math.floor(quizResult.timeSpent / 1000)}s

${results.map((r, i) => 
  `// Q${i + 1}: ${r.isCorrect ? '✓' : '✗'} ${r.question}
// Answer: ${r.userAnswer}
// Correct: ${r.correctAnswer}`
).join('\n')}`;



      await onSubmitSolution(quizCode, quizResult);
    } catch (error: any) {
      console.error('Failed to submit quiz results:', error);
      
      // Show more specific error message
      let errorMessage = 'Failed to submit quiz results';
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid quiz data submitted';
      } else if (error.response?.status === 404) {
        errorMessage = 'Quiz session not found';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - please check your connection';
      }
      
      // You might want to show this error to the user
      console.error('Quiz submission error:', errorMessage);
    } finally {
      setIsSubmitting(false);
    }

    // Don't call onComplete immediately - let user see results first
    // onComplete(quizResult);
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

  // Always show results if quiz is completed, regardless of other state
  if ((showResult && result) || (quizCompleted && result)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-4xl mx-auto space-y-6 ${isInLayout ? '' : 'p-6'}`}
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
            {result.accuracy >= 80 ? 'Excellent work!' : result.accuracy >= 60 ? 'Good job!' : 'Keep practicing!'}
          </motion.p>
        </div>

        {/* Score Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <motion.div 
            className="card p-4 text-center relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-orange-500/10"></div>
            <div className="relative">
              <div className={`text-3xl font-bold ${getScoreColor(result.accuracy)} flex items-center justify-center`}>
                <Star className="h-6 w-6 mr-1" />
                {result.score}
              </div>
              <div className="text-sm text-muted-foreground">Points Earned</div>
              <div className="text-xs text-muted-foreground mt-1">
                out of {result.totalPoints}
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="card p-4 text-center relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-500/10"></div>
            <div className="relative">
              <div className={`text-3xl font-bold ${getScoreColor(result.accuracy)} flex items-center justify-center`}>
                <Target className="h-6 w-6 mr-1" />
                {result.accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
              <div className="text-xs text-muted-foreground mt-1">
                {result.accuracy >= 90 ? 'Excellent!' : result.accuracy >= 70 ? 'Good job!' : 'Keep practicing!'}
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="card p-4 text-center relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-500/10"></div>
            <div className="relative">
              <div className="text-3xl font-bold text-foreground flex items-center justify-center">
                <CheckCircle className="h-6 w-6 mr-1 text-green-500" />
                {result.correctAnswers}/{result.totalQuestions}
              </div>
              <div className="text-sm text-muted-foreground">Correct Answers</div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round((result.correctAnswers / result.totalQuestions) * 100)}% success rate
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="card p-4 text-center relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-cyan-500/10"></div>
            <div className="relative">
              <div className="text-3xl font-bold text-foreground flex items-center justify-center">
                <Timer className="h-6 w-6 mr-1" />
                {formatTime(Math.floor(result.timeSpent / 1000))}
              </div>
              <div className="text-sm text-muted-foreground">Total Time</div>
              <div className="text-xs text-muted-foreground mt-1">
                ~{Math.round(result.timeSpent / 1000 / result.totalQuestions)}s per question
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Progress Overview
          </h3>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{result.correctAnswers}/{result.totalQuestions} correct</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className={`h-3 rounded-full ${
                  result.accuracy >= 80 ? 'bg-green-500' : 
                  result.accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${result.accuracy}%` }}
                transition={{ duration: 1, delay: 0.8 }}
              />
            </div>
          </div>

          {/* Question by Question Results */}
          <div className="space-y-3">
            {result.results.map((questionResult, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className={`p-4 rounded-lg border-l-4 ${
                  questionResult.isCorrect 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        questionResult.isCorrect 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}>
                        {questionResult.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 font-medium">
                      {questionResult.question}
                    </p>
                    
                    <div className="text-sm space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">Your answer:</span>
                        <span className={`px-2 py-1 rounded font-medium ${
                          questionResult.isCorrect 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {questionResult.userAnswer || 'No answer'}
                        </span>
                      </div>
                      {!questionResult.isCorrect && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">Correct answer:</span>
                          <span className="px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 font-medium">
                            {questionResult.correctAnswer}
                          </span>
                        </div>
                      )}
                      {questionResult.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start space-x-2">
                            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-blue-900 dark:text-blue-100">Explanation: </span>
                              <span className="text-blue-800 dark:text-blue-200">{questionResult.explanation}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className={`text-lg font-bold ${
                      questionResult.isCorrect ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {questionResult.isCorrect ? '+' : '0'}{questionResult.points} pts
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(Math.floor(questionResult.timeSpent / 1000))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Performance Insights */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="card p-6"
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Performance Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Speed Analysis */}
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <Timer className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {Math.round(result.timeSpent / 1000 / result.totalQuestions)}s
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Avg per question</div>
              <div className="text-xs text-muted-foreground mt-1">
                {result.timeSpent / 1000 / result.totalQuestions < 30 ? 'Fast pace!' : 
                 result.timeSpent / 1000 / result.totalQuestions < 60 ? 'Good pace' : 'Take your time'}
              </div>
            </div>

            {/* Accuracy Analysis */}
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                {result.accuracy.toFixed(0)}%
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Accuracy rate</div>
              <div className="text-xs text-muted-foreground mt-1">
                {result.accuracy >= 90 ? 'Outstanding!' : 
                 result.accuracy >= 70 ? 'Well done!' : 'Room for improvement'}
              </div>
            </div>

            {/* Score Analysis */}
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
              <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                {Math.round((result.score / result.totalPoints) * 100)}%
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Score efficiency</div>
              <div className="text-xs text-muted-foreground mt-1">
                {result.score / result.totalPoints >= 0.9 ? 'Perfect!' : 
                 result.score / result.totalPoints >= 0.7 ? 'Great job!' : 'Keep improving!'}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-start space-x-3">
              <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">Recommendations</h4>
                <div className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                  {result.accuracy < 70 && (
                    <p>• Review the topics covered in this quiz to strengthen your understanding</p>
                  )}
                  {result.timeSpent / 1000 / result.totalQuestions > 60 && (
                    <p>• Practice similar questions to improve your response time</p>
                  )}
                  {result.correctAnswers === result.totalQuestions && (
                    <p>• Excellent work! Try a more challenging quiz to continue growing</p>
                  )}
                  {result.accuracy >= 70 && result.accuracy < 90 && (
                    <p>• You're doing well! Focus on the areas where you made mistakes</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex justify-center space-x-4"
        >
          <Button
            variant="outline"
            onClick={() => {
              onComplete(result);
              onExit();
            }}
            icon={<RotateCcw className="h-4 w-4" />}
          >
            Back to Games
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="card p-8">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Questions Available</h2>
          <p className="text-muted-foreground mb-4">
            This quiz doesn't have any questions configured yet.
          </p>
          <Button onClick={onExit}>Back to Games</Button>
        </div>
      </div>
    );
  }

  // If quiz is completed but we're somehow still rendering questions, show loading
  if (quizCompleted && !showResult) {
    return (
      <div className={`max-w-4xl mx-auto text-center ${isInLayout ? '' : 'p-6'}`}>
        <div className="card p-8">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading Results...</h2>
          <p className="text-muted-foreground">Please wait while we prepare your quiz results.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-4xl mx-auto space-y-6 ${isInLayout ? '' : 'p-6'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <Code className="h-6 w-6 mr-2" />
            {game.title}
          </h1>
          <p className="text-muted-foreground">{game.description}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {game.timeLimit && (
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
                  {currentQuestion.timeLimit && (
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{currentQuestion.timeLimit}s</span>
                    </div>
                  )}
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
                      whileHover={!showFeedback ? { scale: 1.02 } : {}}
                      whileTap={!showFeedback ? { scale: 0.98 } : {}}
                      onClick={() => !showFeedback && handleAnswerSelect(option)}
                      disabled={showFeedback}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        showFeedback 
                          ? selectedAnswer === option
                            ? currentQuestionResult?.isCorrect
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : option === currentQuestionResult?.correctAnswer && !currentQuestionResult?.isCorrect
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-300 bg-gray-50 dark:bg-gray-800 opacity-60'
                          : selectedAnswer === option
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-border hover:border-primary-300'
                      } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
                      whileHover={!showFeedback ? { scale: 1.02 } : {}}
                      whileTap={!showFeedback ? { scale: 0.98 } : {}}
                      onClick={() => !showFeedback && handleAnswerSelect(option)}
                      disabled={showFeedback}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        showFeedback 
                          ? selectedAnswer === option
                            ? currentQuestionResult?.isCorrect
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : option === currentQuestionResult?.correctAnswer && !currentQuestionResult?.isCorrect
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-300 bg-gray-50 dark:bg-gray-800 opacity-60'
                          : selectedAnswer === option
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-border hover:border-primary-300'
                      } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'short_answer' && (
                <textarea
                  value={selectedAnswer}
                  onChange={(e) => !showFeedback && handleAnswerSelect(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={showFeedback}
                  className={`w-full p-4 border-2 rounded-lg focus:outline-none resize-none ${
                    showFeedback 
                      ? 'border-gray-300 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                      : 'border-border focus:border-primary-500'
                  }`}
                  rows={4}
                />
              )}

              {currentQuestion.type === 'code' && (
                <textarea
                  value={selectedAnswer}
                  onChange={(e) => !showFeedback && handleAnswerSelect(e.target.value)}
                  placeholder="Write your code here..."
                  disabled={showFeedback}
                  className={`w-full p-4 border-2 rounded-lg focus:outline-none font-mono text-sm resize-none ${
                    showFeedback 
                      ? 'border-gray-300 bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
                      : 'border-border focus:border-primary-500 bg-gray-900 text-gray-100'
                  }`}
                  rows={8}
                />
              )}
            </div>
          </div>

          {/* Immediate Feedback */}
          <AnimatePresence>
            {showFeedback && currentQuestionResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 border rounded-lg ${
                  currentQuestionResult.isCorrect 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${
                    currentQuestionResult.isCorrect 
                      ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-100' 
                      : 'bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-100'
                  }`}>
                    {currentQuestionResult.isCorrect ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className={`font-semibold ${
                        currentQuestionResult.isCorrect 
                          ? 'text-green-900 dark:text-green-100' 
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        {currentQuestionResult.isCorrect ? 'Correct!' : 'Incorrect'}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        currentQuestionResult.isCorrect 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}>
                        {currentQuestionResult.isCorrect ? `+${currentQuestion.points} pts` : '0 pts'}
                      </span>
                    </div>
                    
                    {!currentQuestionResult.isCorrect && (
                      <div className="mb-3">
                        <p className="text-sm text-red-800 dark:text-red-200 mb-1">
                          <span className="font-medium">Correct answer:</span>
                        </p>
                        <div className="px-3 py-2 bg-green-100 dark:bg-green-800 rounded border border-green-200 dark:border-green-700">
                          <span className="text-green-800 dark:text-green-100 font-medium">
                            {currentQuestionResult.correctAnswer}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {currentQuestionResult.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start space-x-2">
                          <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-blue-900 dark:text-blue-100">Explanation: </span>
                            <span className="text-blue-800 dark:text-blue-200">{currentQuestionResult.explanation}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>
            
            <div className="space-x-3">
              {showFeedback ? (
                <Button
                  onClick={handleNextQuestion}
                  icon={isLastQuestion ? <Trophy className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  disabled={isSubmitting}
                  className={currentQuestionResult?.isCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                >
                  {isSubmitting ? 'Submitting...' : isLastQuestion ? 'Finish Quiz' : 'Next Question'}
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

export default CodingQuizGame;