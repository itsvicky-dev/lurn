import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Circle, 
  Trophy, 
  RotateCcw, 
  Zap,
  Brain,
  Target,
  Sparkles
} from 'lucide-react';
import Button from '../ui/Button';

type Player = 'X' | 'O' | null;
type Board = Player[];
type GameMode = 'human' | 'ai-easy' | 'ai-hard';

interface TicTacToeGameProps {
  onClose?: () => void;
  compact?: boolean;
  showScore?: boolean;
}

interface GameStats {
  playerWins: number;
  aiWins: number;
  draws: number;
  gamesPlayed: number;
}

const TicTacToeGame: React.FC<TicTacToeGameProps> = ({ 
  onClose, 
  compact = false,
  showScore = true 
}) => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('ai-easy');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [stats, setStats] = useState<GameStats>({
    playerWins: 0,
    aiWins: 0,
    draws: 0,
    gamesPlayed: 0
  });
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  // Check for winner
  useEffect(() => {
    const checkWinner = () => {
      for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          setWinner(board[a]);
          setWinningLine(combination);
          updateStats(board[a]);
          return;
        }
      }

      if (board.every(cell => cell !== null)) {
        setWinner('draw');
        updateStats('draw');
      }
    };

    checkWinner();
  }, [board]);

  // AI move
  useEffect(() => {
    if (currentPlayer === 'O' && !winner && gameStarted && gameMode !== 'human') {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        makeAiMove();
        setIsAiThinking(false);
      }, 500 + Math.random() * 1000); // Random delay for realism

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, winner, gameStarted, gameMode]);

  const updateStats = (result: Player | 'draw') => {
    setStats(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      playerWins: result === 'X' ? prev.playerWins + 1 : prev.playerWins,
      aiWins: result === 'O' ? prev.aiWins + 1 : prev.aiWins,
      draws: result === 'draw' ? prev.draws + 1 : prev.draws
    }));
  };

  const makeMove = (index: number) => {
    if (board[index] || winner || currentPlayer === 'O') return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setCurrentPlayer('O');
    
    if (!gameStarted) setGameStarted(true);
  };

  const makeAiMove = () => {
    const availableMoves = board.map((cell, index) => cell === null ? index : null)
                              .filter(val => val !== null) as number[];

    if (availableMoves.length === 0) return;

    let move: number;

    if (gameMode === 'ai-hard') {
      move = getBestMove();
    } else {
      // Easy AI - random move with occasional smart move
      if (Math.random() < 0.3) {
        move = getBestMove();
      } else {
        move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      }
    }

    const newBoard = [...board];
    newBoard[move] = 'O';
    setBoard(newBoard);
    setCurrentPlayer('X');
  };

  const getBestMove = (): number => {
    // Try to win
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] === 'O' && board[b] === 'O' && board[c] === null) return c;
      if (board[a] === 'O' && board[c] === 'O' && board[b] === null) return b;
      if (board[b] === 'O' && board[c] === 'O' && board[a] === null) return a;
    }

    // Block player from winning
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] === 'X' && board[b] === 'X' && board[c] === null) return c;
      if (board[a] === 'X' && board[c] === 'X' && board[b] === null) return b;
      if (board[b] === 'X' && board[c] === 'X' && board[a] === null) return a;
    }

    // Take center if available
    if (board[4] === null) return 4;

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(corner => board[corner] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Take any available move
    const availableMoves = board.map((cell, index) => cell === null ? index : null)
                              .filter(val => val !== null) as number[];
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine([]);
    setGameStarted(false);
    setIsAiThinking(false);
  };

  const resetStats = () => {
    setStats({
      playerWins: 0,
      aiWins: 0,
      draws: 0,
      gamesPlayed: 0
    });
  };

  const getCellIcon = (player: Player, index: number) => {
    if (!player) return null;
    
    const isWinning = winningLine.includes(index);
    const iconClass = `h-8 w-8 ${isWinning ? 'text-yellow-500 dark:text-yellow-400' : player === 'X' ? 'text-primary' : 'text-destructive'}`;
    
    return player === 'X' ? <X className={iconClass} /> : <Circle className={iconClass} />;
  };

  const getWinnerMessage = () => {
    if (winner === 'X') return '🎉 You Win!';
    if (winner === 'O') return '🤖 AI Wins!';
    if (winner === 'draw') return '🤝 It\'s a Draw!';
    return '';
  };

  const getWinnerColor = () => {
    if (winner === 'X') return 'text-green-500';
    if (winner === 'O') return 'text-destructive';
    return 'text-yellow-500 dark:text-yellow-400';
  };

  if (compact) {
    return (
      <div className="bg-card rounded-lg p-4 shadow-lg max-w-sm mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-card-foreground">Tic-Tac-Toe</h3>
          <p className="text-sm text-muted-foreground">Play while you wait!</p>
        </div>

        {/* Compact Board */}
        <div className="grid grid-cols-3 gap-1 mb-4">
          {board.map((cell, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => makeMove(index)}
              className={`aspect-square bg-muted border-2 border-border rounded-lg flex items-center justify-center transition-all ${
                !cell && !winner && currentPlayer === 'X' ? 'hover:bg-accent hover:border-primary' : ''
              } ${winningLine.includes(index) ? 'bg-yellow-100 dark:bg-yellow-900 border-yellow-400' : ''}`}
              disabled={!!cell || !!winner || currentPlayer === 'O'}
            >
              {getCellIcon(cell, index)}
            </motion.button>
          ))}
        </div>

        {/* Game Status */}
        <div className="text-center space-y-2">
          {winner ? (
            <div className={`text-lg font-bold ${getWinnerColor()}`}>
              {getWinnerMessage()}
            </div>
          ) : isAiThinking ? (
            <div className="text-primary flex items-center justify-center space-x-2">
              <Brain className="h-4 w-4 animate-pulse" />
              <span>AI thinking...</span>
            </div>
          ) : (
            <div className="text-muted-foreground">
              Your turn (X)
            </div>
          )}

          <div className="flex justify-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={resetGame}
              icon={<RotateCcw className="h-3 w-3" />}
            >
              New Game
            </Button>
            {onClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
              >
                Close
              </Button>
            )}
          </div>
        </div>
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
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <Target className="h-8 w-8" />
          </div>
        </motion.div>
        
        <h1 className="text-3xl font-bold text-foreground">Tic-Tac-Toe</h1>
        <p className="text-muted-foreground">Challenge the AI and test your strategy!</p>
      </div>

      {/* Game Mode Selection */}
      {!gameStarted && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card p-4"
        >
          <h3 className="font-semibold mb-3">Choose Difficulty</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setGameMode('ai-easy')}
              className={`p-3 rounded-lg border-2 transition-all ${
                gameMode === 'ai-easy' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' 
                  : 'border-border hover:border-green-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Easy AI</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Good for beginners</p>
            </button>
            
            <button
              onClick={() => setGameMode('ai-hard')}
              className={`p-3 rounded-lg border-2 transition-all ${
                gameMode === 'ai-hard' 
                  ? 'border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' 
                  : 'border-border hover:border-red-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Hard AI</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Nearly unbeatable</p>
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      {showScore && stats.gamesPlayed > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-4 gap-4"
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
            <div className="text-2xl font-bold text-foreground">{stats.gamesPlayed}</div>
            <div className="text-xs text-muted-foreground">Total Games</div>
          </div>
        </motion.div>
      )}

      {/* Game Board */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="card p-6"
      >
        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
          {board.map((cell, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: cell || winner ? 1 : 1.05 }}
              whileTap={{ scale: cell || winner ? 1 : 0.95 }}
              onClick={() => makeMove(index)}
              className={`aspect-square bg-background border-2 border-border rounded-lg flex items-center justify-center transition-all text-2xl font-bold ${
                !cell && !winner && currentPlayer === 'X' ? 'hover:bg-accent hover:border-primary' : ''
              } ${winningLine.includes(index) ? 'bg-yellow-100 dark:bg-yellow-900 border-yellow-400 shadow-lg' : ''}`}
              disabled={!!cell || !!winner || currentPlayer === 'O'}
            >
              <AnimatePresence>
                {cell && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {getCellIcon(cell, index)}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Game Status */}
        <div className="text-center mt-6 space-y-4">
          <AnimatePresence mode="wait">
            {winner ? (
              <motion.div
                key="winner"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-2"
              >
                <div className={`text-2xl font-bold ${getWinnerColor()}`}>
                  {getWinnerMessage()}
                </div>
                {winner === 'X' && (
                  <div className="flex justify-center">
                    <Trophy className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
                  </div>
                )}
              </motion.div>
            ) : isAiThinking ? (
              <motion.div
                key="thinking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center space-x-2 text-primary"
              >
                <Brain className="h-5 w-5 animate-pulse" />
                <span className="text-lg">AI is thinking...</span>
              </motion.div>
            ) : (
              <motion.div
                key="turn"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-lg text-muted-foreground"
              >
                {currentPlayer === 'X' ? 'Your turn (X)' : 'AI\'s turn (O)'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-center space-x-4"
      >
        <Button
          variant="outline"
          onClick={resetGame}
          icon={<RotateCcw className="h-4 w-4" />}
        >
          New Game
        </Button>
        
        {stats.gamesPlayed > 0 && (
          <Button
            variant="ghost"
            onClick={resetStats}
            size="sm"
          >
            Reset Stats
          </Button>
        )}
        
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

export default TicTacToeGame;