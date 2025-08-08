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
  RotateCcw,
  Lightbulb
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
          className="space-y-6"
        >
          {/* Main Score Display */}
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(result.accuracy)} mb-2`}>
              {result.score}
            </div>
            <div className="text-lg text-muted-foreground mb-4">
              out of {result.totalPoints} points
            </div>
            
            {/* Performance Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-accent-100">
              {result.accuracy >= 90 ? (
                <>
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-700">Excellent!</span>
                </>
              ) : result.accuracy >= 70 ? (
                <>
                  <Star className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold text-blue-700">Good Job!</span>
                </>
              ) : result.accuracy >= 50 ? (
                <>
                  <Target className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold text-orange-700">Keep Trying!</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-5 w-5 text-red-500" />
                  <span className="font-semibold text-red-700">Practice More!</span>
                </>
              )}
            </div>
          </div>

          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center border-l-4 border-green-500">
              <div className="text-2xl font-bold text-green-600">
                {result.correctAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Correct Answers</div>
              <div className="text-xs text-green-600 mt-1">
                {((result.correctAnswers / result.totalQuestions) * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="card p-4 text-center border-l-4 border-red-500">
              <div className="text-2xl font-bold text-red-600">
                {result.totalQuestions - result.correctAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Wrong Answers</div>
              <div className="text-xs text-red-600 mt-1">
                {(((result.totalQuestions - result.correctAnswers) / result.totalQuestions) * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="card p-4 text-center border-l-4 border-blue-500">
              <div className="text-2xl font-bold text-blue-600">
                {result.accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
              <div className="text-xs text-blue-600 mt-1">
                Overall Performance
              </div>
            </div>
            
            <div className="card p-4 text-center border-l-4 border-purple-500">
              <div className="text-2xl font-bold text-purple-600">
                {formatTime(Math.floor(result.timeSpent / 1000))}
              </div>
              <div className="text-sm text-muted-foreground">Total Time</div>
              <div className="text-xs text-purple-600 mt-1">
                Avg: {formatTime(Math.floor(result.timeSpent / 1000 / result.totalQuestions))}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Quiz Progress</span>
              <span className="text-sm text-muted-foreground">
                {result.correctAnswers} of {result.totalQuestions} questions correct
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${result.accuracy}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span className="font-medium">{result.accuracy.toFixed(1)}%</span>
              <span>100%</span>
            </div>
          </div>
        </motion.div>

        {/* Detailed Results */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
          data-results-section
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Question-by-Question Results
            </h3>
            <div className="text-sm text-muted-foreground">
              {result.correctAnswers} correct • {result.totalQuestions - result.correctAnswers} incorrect
            </div>
          </div>
          
          <div className="space-y-4">
            {result.results.map((questionResult, index) => {
              const question = questions.find(q => q.id === questionResult.questionId);
              return (
                <motion.div
                  key={questionResult.questionId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={`p-5 rounded-lg border-2 transition-all ${
                    questionResult.isCorrect 
                      ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' 
                      : 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        questionResult.isCorrect 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {questionResult.isCorrect ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-lg">Question {index + 1}</span>
                          {question && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                              {question.difficulty}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          <span>{formatTime(Math.floor(questionResult.timeSpent / 1000))}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        questionResult.isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {questionResult.points}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {question ? `/ ${question.points}` : ''} pts
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-foreground font-medium mb-3">
                      {questionResult.question}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {/* User's Answer */}
                    <div className={`p-3 rounded-lg ${
                      questionResult.isCorrect 
                        ? 'bg-green-100 border border-green-200' 
                        : 'bg-red-100 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-semibold">Your Answer:</span>
                        {questionResult.isCorrect ? (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                            ✓ Correct
                          </span>
                        ) : (
                          <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                            ✗ Incorrect
                          </span>
                        )}
                      </div>
                      <p className={`font-medium ${
                        questionResult.isCorrect ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {questionResult.userAnswer || 'No answer provided'}
                      </p>
                    </div>
                    
                    {/* Correct Answer (if wrong) */}
                    {!questionResult.isCorrect && (
                      <div className="p-3 rounded-lg bg-green-100 border border-green-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-semibold text-green-700">Correct Answer:</span>
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                            ✓ Right Answer
                          </span>
                        </div>
                        <p className="font-medium text-green-700">
                          {questionResult.correctAnswer}
                        </p>
                      </div>
                    )}
                    
                    {/* Explanation (if available) */}
                    {question?.explanation && (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-700">Explanation:</span>
                        </div>
                        <p className="text-blue-700 text-sm">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          {/* Performance Message */}
          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200">
            <p className="text-foreground font-medium">
              {result.accuracy >= 90 
                ? "Outstanding performance! You've mastered this topic!" 
                : result.accuracy >= 70 
                ? "Great job! You have a solid understanding of the material."
                : result.accuracy >= 50 
                ? "Good effort! Review the explanations and try again to improve."
                : "Keep practicing! Review the material and take the quiz again."}
            </p>
            {result.accuracy < 70 && (
              <p className="text-muted-foreground text-sm mt-2">
                Focus on the questions you got wrong and their explanations above.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button
              variant="outline"
              onClick={onExit}
              icon={<RotateCcw className="h-4 w-4" />}
              className="flex-1 sm:flex-none"
            >
              Back to Games
            </Button>
            
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              icon={<Zap className="h-4 w-4" />}
              className="flex-1 sm:flex-none"
            >
              {result.accuracy >= 90 ? 'Try Another Quiz' : 'Retake Quiz'}
            </Button>
            
            {result.accuracy < 70 && (
              <Button
                variant="secondary"
                onClick={() => {
                  // Scroll to detailed results
                  const resultsSection = document.querySelector('[data-results-section]');
                  if (resultsSection) {
                    resultsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                icon={<Target className="h-4 w-4" />}
                className="flex-1 sm:flex-none"
              >
                Review Answers
              </Button>
            )}
          </div>

          {/* Study Suggestions */}
          {result.accuracy < 80 && (
            <div className="text-center text-sm text-muted-foreground">
              <p>💡 <strong>Study Tip:</strong> Review the explanations for incorrect answers to improve your understanding.</p>
            </div>
          )}
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