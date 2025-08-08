import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, 
  Trophy, 
  RotateCcw, 
  Zap,
  Brain,
  Target,
  Sparkles,
  Hand,
  Square
} from 'lucide-react';
import Button from '../ui/Button';

type Choice = 'rock' | 'paper' | 'scissors' | null;
type Result = 'win' | 'lose' | 'draw' | null;

interface RockPaperScissorsGameProps {
  onClose?: () => void;
  compact?: boolean;
  showScore?: boolean;
}

interface GameStats {
  playerWins: number;
  aiWins: number;
  draws: number;
  gamesPlayed: number;
  streak: number;
  bestStreak: number;
}

interface Round {
  playerChoice: Choice;
  aiChoice: Choice;
  result: Result;
  round: number;
}

const RockPaperScissorsGame: React.FC<RockPaperScissorsGameProps> = ({ 
  onClose, 
  compact = false,
  showScore = true 
}) => {
  const [playerChoice, setPlayerChoice] = useState<Choice>(null);
  const [aiChoice, setAiChoice] = useState<Choice>(null);
  const [result, setResult] = useState<Result>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState<GameStats>({
    playerWins: 0,
    aiWins: 0,
    draws: 0,
    gamesPlayed: 0,
    streak: 0,
    bestStreak: 0
  });
  const [gameHistory, setGameHistory] = useState<Round[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);

  const choices: { value: Choice; icon: React.ReactNode; label: string; emoji: string }[] = [
    { value: 'rock', icon: <Square className="h-8 w-8" />, label: 'Rock', emoji: '🪨' },
    { value: 'paper', icon: <Hand className="h-8 w-8" />, label: 'Paper', emoji: '📄' },
    { value: 'scissors', icon: <Scissors className="h-8 w-8" />, label: 'Scissors', emoji: '✂️' }
  ];

  const getWinner = (player: Choice, ai: Choice): Result => {
    if (player === ai) return 'draw';
    
    if (
      (player === 'rock' && ai === 'scissors') ||
      (player === 'paper' && ai === 'rock') ||
      (player === 'scissors' && ai === 'paper')
    ) {
      return 'win';
    }
    
    return 'lose';
  };

  const getAiChoice = (): Choice => {
    const choices: Choice[] = ['rock', 'paper', 'scissors'];
    
    // Simple AI with some pattern recognition
    if (gameHistory.length >= 3) {
      const recentChoices = gameHistory.slice(-3).map(round => round.playerChoice);
      const mostCommon = recentChoices.reduce((a, b, i, arr) => 
        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
      );
      
      // Counter the most common choice with 60% probability
      if (Math.random() < 0.6) {
        if (mostCommon === 'rock') return 'paper';
        if (mostCommon === 'paper') return 'scissors';
        if (mostCommon === 'scissors') return 'rock';
      }
    }
    
    // Random choice
    return choices[Math.floor(Math.random() * choices.length)];
  };

  const playRound = (choice: Choice) => {
    if (isAiThinking || showResult) return;
    
    setPlayerChoice(choice);
    setIsAiThinking(true);
    setCountdown(3);

    // Countdown animation
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    // AI makes choice after countdown
    setTimeout(() => {
      const aiChoice = getAiChoice();
      const gameResult = getWinner(choice, aiChoice);
      
      setAiChoice(aiChoice);
      setResult(gameResult);
      setIsAiThinking(false);
      setShowResult(true);
      
      // Update stats
      const newStats = { ...stats };
      newStats.gamesPlayed += 1;
      
      if (gameResult === 'win') {
        newStats.playerWins += 1;
        newStats.streak += 1;
        newStats.bestStreak = Math.max(newStats.bestStreak, newStats.streak);
      } else if (gameResult === 'lose') {
        newStats.aiWins += 1;
        newStats.streak = 0;
      } else {
        newStats.draws += 1;
      }
      
      setStats(newStats);
      
      // Add to history
      setGameHistory(prev => [...prev, {
        playerChoice: choice,
        aiChoice,
        result: gameResult,
        round: prev.length + 1
      }]);
      
    }, 3000);
  };

  const resetRound = () => {
    setPlayerChoice(null);
    setAiChoice(null);
    setResult(null);
    setShowResult(false);
    setCountdown(null);
  };

  const resetGame = () => {
    resetRound();
    setStats({
      playerWins: 0,
      aiWins: 0,
      draws: 0,
      gamesPlayed: 0,
      streak: 0,
      bestStreak: 0
    });
    setGameHistory([]);
  };

  const getResultMessage = () => {
    if (result === 'win') return '🎉 You Win!';
    if (result === 'lose') return '🤖 AI Wins!';
    if (result === 'draw') return '🤝 It\'s a Draw!';
    return '';
  };

  const getResultColor = () => {
    if (result === 'win') return 'text-green-500';
    if (result === 'lose') return 'text-destructive';
    return 'text-yellow-500 dark:text-yellow-400';
  };

  const getChoiceDisplay = (choice: Choice, isPlayer: boolean = true) => {
    if (!choice) return null;
    
    const choiceData = choices.find(c => c.value === choice);
    if (!choiceData) return null;

    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        className={`text-center p-4 rounded-lg ${
          isPlayer ? 'bg-primary/10 border-2 border-primary/30' : 'bg-destructive/10 border-2 border-destructive/30'
        }`}
      >
        <div className="text-4xl mb-2">{choiceData.emoji}</div>
        <div className="font-medium">{choiceData.label}</div>
        <div className="text-sm text-muted-foreground">
          {isPlayer ? 'You' : 'AI'}
        </div>
      </motion.div>
    );
  };

  if (compact) {
    return (
      <div className="bg-card rounded-lg p-4 shadow-lg max-w-sm mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-card-foreground">Rock Paper Scissors</h3>
          <p className="text-sm text-muted-foreground">Quick game while you wait!</p>
        </div>

        {/* Compact Game Area */}
        {showResult ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {getChoiceDisplay(playerChoice, true)}
              {getChoiceDisplay(aiChoice, false)}
            </div>
            
            <div className={`text-center text-lg font-bold ${getResultColor()}`}>
              {getResultMessage()}
            </div>
            
            <div className="flex justify-center space-x-2">
              <Button size="sm" onClick={resetRound}>
                Play Again
              </Button>
              {onClose && (
                <Button size="sm" variant="ghost" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        ) : countdown !== null ? (
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary">
              {countdown}
            </div>
            <div className="text-sm text-muted-foreground">Get ready...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground mb-2">
              Choose your move:
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {choices.map((choice) => (
                <motion.button
                  key={choice.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => playRound(choice.value)}
                  className="p-3 bg-muted border-2 border-border rounded-lg hover:bg-accent hover:border-primary transition-all"
                  disabled={isAiThinking}
                >
                  <div className="text-2xl mb-1">{choice.emoji}</div>
                  <div className="text-xs font-medium">{choice.label}</div>
                </motion.button>
              ))}
            </div>
            
            {stats.gamesPlayed > 0 && (
              <div className="text-center text-xs text-muted-foreground">
                Score: {stats.playerWins}-{stats.aiWins}-{stats.draws}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-center"
        >
          <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <Hand className="h-8 w-8" />
          </div>
        </motion.div>
        
        <h1 className="text-3xl font-bold text-foreground">Rock Paper Scissors</h1>
        <p className="text-muted-foreground">Classic game of strategy and luck!</p>
      </div>

      {/* Stats */}
      {showScore && stats.gamesPlayed > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.playerWins}</div>
            <div className="text-xs text-muted-foreground">Your Wins</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-destructive">{stats.aiWins}</div>
            <div className="text-xs text-muted-foreground">AI Wins</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">{stats.draws}</div>
            <div className="text-xs text-muted-foreground">Draws</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.streak}</div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-secondary">{stats.bestStreak}</div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </div>
        </motion.div>
      )}

      {/* Game Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="card p-6"
      >
        <AnimatePresence mode="wait">
          {countdown !== null ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="text-center space-y-4"
            >
              <div className="text-8xl font-bold text-primary">
                {countdown}
              </div>
              <div className="text-lg text-muted-foreground">
                {countdown === 3 ? 'Rock!' : countdown === 2 ? 'Paper!' : 'Scissors!'}
              </div>
            </motion.div>
          ) : showResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-8">
                {getChoiceDisplay(playerChoice, true)}
                {getChoiceDisplay(aiChoice, false)}
              </div>
              
              <div className="text-center space-y-4">
                <div className={`text-3xl font-bold ${getResultColor()}`}>
                  {getResultMessage()}
                </div>
                
                {result === 'win' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex justify-center"
                  >
                    <Trophy className="h-12 w-12 text-yellow-500 dark:text-yellow-400" />
                  </motion.div>
                )}
                
                {stats.streak > 1 && result === 'win' && (
                  <div className="text-lg text-primary font-medium">
                    🔥 {stats.streak} Win Streak!
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="choices"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Choose your move</h3>
                <p className="text-muted-foreground">Click on rock, paper, or scissors</p>
              </div>
              
              <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
                {choices.map((choice) => (
                  <motion.button
                    key={choice.value}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => playRound(choice.value)}
                    className="p-6 bg-background border-2 border-border rounded-lg hover:border-primary hover:bg-accent transition-all group"
                    disabled={isAiThinking}
                  >
                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                      {choice.emoji}
                    </div>
                    <div className="font-medium text-foreground">{choice.label}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Game History */}
      {gameHistory.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card p-4"
        >
          <h3 className="font-semibold mb-3 flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Recent Games
          </h3>
          
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {gameHistory.slice(-10).map((round, index) => (
              <div
                key={round.round}
                className={`flex-shrink-0 p-2 rounded-lg border text-xs ${
                  round.result === 'win' 
                    ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800' 
                    : round.result === 'lose'
                    ? 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800'
                    : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg">
                    {choices.find(c => c.value === round.playerChoice)?.emoji} vs{' '}
                    {choices.find(c => c.value === round.aiChoice)?.emoji}
                  </div>
                  <div className={`font-medium ${
                    round.result === 'win' ? 'text-green-600 dark:text-green-400' : 
                    round.result === 'lose' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {round.result === 'win' ? 'W' : round.result === 'lose' ? 'L' : 'D'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-center space-x-4"
      >
        {showResult && (
          <Button
            onClick={resetRound}
            icon={<Zap className="h-4 w-4" />}
          >
            Play Again
          </Button>
        )}
        
        <Button
          variant="outline"
          onClick={resetGame}
          icon={<RotateCcw className="h-4 w-4" />}
        >
          Reset Game
        </Button>
        
        {onClose && (
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Close Game
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RockPaperScissorsGame;