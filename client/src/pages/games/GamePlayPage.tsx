import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import { 
  Play, 
  Square, 
  Lightbulb, 
  RotateCcw, 
  Home,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trophy,
  Target,
  Zap,
  Code,
  Bug,
  Puzzle,
  Timer,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import CodingQuizGame from '../../components/games/CodingQuizGame';
import toast from 'react-hot-toast';

const CodeEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
}> = ({ value, onChange, language, readOnly = false }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      className="w-full h-full min-h-[400px] p-4 font-mono text-sm bg-gray-900 text-gray-100 border-none outline-none resize-none rounded-lg"
      placeholder={`Write your ${language} code here...`}
      spellCheck={false}
    />
  );
};

const GamePlayPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentGame,
    currentSession,
    loading,
    loadingMessage,
    loadGame,
    startGame,
    submitGameSolution,
    useHint,
    abandonGame,
    setCurrentGame,
    setCurrentSession
  } = useGame();

  const [code, setCode] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [usedHints, setUsedHints] = useState<number[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'instructions' | 'hints' | 'results'>('instructions');

  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const initializeGame = async () => {
      if (!gameId) return;

      try {
        // If we don't have a current session, start a new game
        if (!currentSession || currentSession.gameId !== gameId) {
          await startGame(gameId);
        } else {
          // Load game details if not already loaded
          if (!currentGame || currentGame.id !== gameId) {
            const game = await loadGame(gameId);
            setCurrentGame(game);
          }
          // Restore session state
          setCode(currentSession.code);
          setTimeElapsed(currentSession.timeSpent);
          setUsedHints(Array.from({ length: currentSession.hintsUsed }, (_, i) => i));
        }
      } catch (error) {
        navigate('/games');
      }
    };

    initializeGame();
  }, [gameId]);

  useEffect(() => {
    if (currentGame?.starterCode && !code) {
      setCode(currentGame.starterCode);
    }
  }, [currentGame]);

  useEffect(() => {
    // Start timer when game is active
    if (currentSession && currentSession.status === 'in_progress') {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentSession]);

  const handleRunCode = async () => {
    if (!currentSession) return;

    try {
      setIsRunning(true);
      const updatedSession = await submitGameSolution(currentSession.id, code);
      
      if (updatedSession.testResults) {
        setShowTestResults(true);
        setActiveTab('results');
      }

      if (updatedSession.status === 'completed') {
        // Game completed successfully
        setTimeout(() => {
          navigate('/games');
        }, 3000);
      }
    } catch (error) {
      // Error handled in context
    } finally {
      setIsRunning(false);
    }
  };

  const handleUseHint = async (hintIndex: number) => {
    if (!currentSession || usedHints.includes(hintIndex)) return;

    try {
      await useHint(currentSession.id, hintIndex);
      setUsedHints(prev => [...prev, hintIndex]);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleResetCode = () => {
    if (currentGame?.starterCode) {
      setCode(currentGame.starterCode);
    } else {
      setCode('');
    }
  };

  const handleAbandonGame = async () => {
    if (!currentSession) return;

    if (window.confirm('Are you sure you want to abandon this game? Your progress will be lost.')) {
      try {
        await abandonGame(currentSession.id);
        navigate('/games');
      } catch (error) {
        // Error handled in context
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGameTypeIcon = (type: string) => {
    const icons = {
      code_challenge: Code,
      bug_hunt: Bug,
      code_completion: Puzzle,
      syntax_puzzle: Target,
      algorithm_race: Timer,
    };
    return icons[type as keyof typeof icons] || Code;
  };

  if (loading || !currentGame || !currentSession) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" variant="cyber" text={loadingMessage || "Loading game..."} />
      </div>
    );
  }

  const IconComponent = getGameTypeIcon(currentGame.type);

  // Handle quiz games differently
  if (currentGame.type === 'quiz') {
    // Check if we're in the layout (quiz route) or full-screen (play route)
    const isInLayout = location.pathname.includes('/games/quiz/');
    
    return (
      <div className={isInLayout ? "container mx-auto p-6" : "min-h-screen bg-background"}>
        <CodingQuizGame
          key={`quiz-${currentGame.id}-${currentSession?.id}`}
          game={currentGame}
          session={currentSession}
          isInLayout={isInLayout}
          onComplete={(result) => {
            // Quiz completion is handled within the component
            console.log('Quiz completed:', result);
            // Don't navigate away immediately - let user see results
          }}
          onExit={() => navigate('/games')}
          onSubmitSolution={async (code, quizResults) => {
            if (currentSession) {
              await submitGameSolution(currentSession.id, code, quizResults);
            }
          }}
        />
      </div>
    );
  }

  return (
    <motion.div 
      className="h-full flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/games')}
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            Back to Games
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-white">
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{currentGame.title}</h1>
              <p className="text-sm text-muted-foreground">{currentGame.language}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono">{formatTime(timeElapsed)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>{currentGame.points} pts</span>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleAbandonGame}
          >
            Abandon
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Panel - Instructions/Hints/Results */}
        <div className="w-1/3 border-r border-border bg-card">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {[
              { id: 'instructions', label: 'Instructions', icon: AlertCircle },
              { id: 'hints', label: 'Hints', icon: Lightbulb },
              { id: 'results', label: 'Results', icon: Target },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground border-b-2 border-primary-500'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === 'hints' && usedHints.length > 0 && (
                  <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-1">
                    {usedHints.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 h-full overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'instructions' && (
                <motion.div
                  key="instructions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{currentGame.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Instructions</h3>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {currentGame.instructions}
                    </div>
                  </div>

                  {currentGame.testCases.filter(tc => !tc.isHidden).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Example Test Cases</h3>
                      <div className="space-y-2">
                        {currentGame.testCases
                          .filter(tc => !tc.isHidden)
                          .map((testCase, index) => (
                            <div key={index} className="p-3 bg-muted rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">
                                {testCase.description}
                              </p>
                              <div className="font-mono text-xs">
                                <div><strong>Input:</strong> {testCase.input}</div>
                                <div><strong>Expected:</strong> {testCase.expectedOutput}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'hints' && (
                <motion.div
                  key="hints"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Available Hints</h3>
                    <span className="text-xs text-muted-foreground">
                      {usedHints.length}/{currentGame.hints.length} used
                    </span>
                  </div>
                  
                  {currentGame.hints.map((hint, index) => (
                    <div key={index} className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Hint {index + 1}</span>
                        {!usedHints.includes(index) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUseHint(index)}
                            icon={<Eye className="h-3 w-3" />}
                          >
                            Reveal
                          </Button>
                        ) : (
                          <span className="text-xs text-green-600 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Used
                          </span>
                        )}
                      </div>
                      
                      {usedHints.includes(index) ? (
                        <p className="text-sm text-muted-foreground">{hint}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Click "Reveal" to see this hint (affects your score)
                        </p>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'results' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {currentSession.testResults && currentSession.testResults.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Test Results</h3>
                        <span className={`text-sm font-medium ${
                          currentSession.status === 'completed' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {currentSession.testResults.filter(r => r.passed).length}/
                          {currentSession.testResults.length} passed
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {currentSession.testResults.map((result, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border ${
                              result.passed 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-red-200 bg-red-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                Test Case {index + 1}
                              </span>
                              {result.passed ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            
                            <div className="font-mono text-xs space-y-1">
                              <div><strong>Expected:</strong> {result.expectedOutput}</div>
                              <div><strong>Actual:</strong> {result.actualOutput}</div>
                              {result.error && (
                                <div className="text-red-600">
                                  <strong>Error:</strong> {result.error}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {currentSession.status === 'completed' && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="p-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg text-center"
                        >
                          <Trophy className="h-8 w-8 mx-auto mb-2" />
                          <h3 className="font-bold text-lg">Congratulations!</h3>
                          <p className="text-sm opacity-90">
                            You earned {currentSession.score} points!
                          </p>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Run your code to see test results
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <div className="flex items-center space-x-2">
              <Code className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Code Editor</span>
              <span className="text-xs text-muted-foreground">({currentGame.language})</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetCode}
                icon={<RotateCcw className="h-3 w-3" />}
              >
                Reset
              </Button>
              
              <Button
                onClick={handleRunCode}
                disabled={isRunning || currentSession.status === 'completed'}
                icon={isRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </Button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 p-4">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={currentGame.language}
              readOnly={currentSession.status === 'completed'}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GamePlayPage;