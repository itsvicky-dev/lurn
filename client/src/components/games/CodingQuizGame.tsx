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
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
  onSubmitSolution: (code: string) => Promise<void>;
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
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setResult(quizResult);
    setShowResult(true);
    
    // Submit the quiz result as a "code solution" to integrate with the game system
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

      await onSubmitSolution(quizCode);
    } catch (error) {
      console.error('Failed to submit quiz results:', error);
    } finally {
      setIsSubmitting(false);
    }

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
          <div className="card p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(result.accuracy)}`}>
              {result.score}
            </div>
            <div className="text-sm text-muted-foreground">Points Earned</div>
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
                key={index}
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
                      {questionResult.explanation && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800">
                          <span className="font-medium">Explanation: </span>
                          {questionResult.explanation}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 space-y-6"
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
                  className="w-full p-4 border-2 border-border rounded-lg focus:border-primary-500 focus:outline-none font-mono text-sm resize-none bg-gray-900 text-gray-100"
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
                    <Lightbulb className="h-4 w-4" />
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
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>
            
            <div className="space-x-3">
              {showExplanation ? (
                <Button
                  onClick={handleNextQuestion}
                  icon={isLastQuestion ? <Trophy className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  disabled={isSubmitting}
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