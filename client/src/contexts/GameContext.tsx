import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type CodingGame, type GameSession, type GameProgress, type GameLeaderboard } from '../types';
import apiService from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface GameContextType {
  games: CodingGame[];
  currentGame: CodingGame | null;
  currentSession: GameSession | null;
  gameProgress: GameProgress | null;
  leaderboard: GameLeaderboard | null;
  loading: boolean;
  loadingMessage: string;
  
  // Game management
  loadGames: (filters?: GameFilters) => Promise<void>;
  loadGame: (gameId: string) => Promise<CodingGame>;
  startGame: (gameId: string) => Promise<GameSession>;
  submitGameSolution: (sessionId: string, code: string) => Promise<GameSession>;
  useHint: (sessionId: string, hintIndex: number) => Promise<void>;
  abandonGame: (sessionId: string) => Promise<void>;
  generateGame: (gameParams: GameGenerationParams) => Promise<CodingGame>;
  
  // Progress and stats
  loadGameProgress: () => Promise<void>;
  loadLeaderboard: (period?: 'daily' | 'weekly' | 'monthly' | 'all_time') => Promise<void>;
  
  // Session management
  setCurrentGame: (game: CodingGame | null) => void;
  setCurrentSession: (session: GameSession | null) => void;
}

interface GameFilters {
  type?: string;
  difficulty?: string;
  language?: string;
  category?: string;
  isUnlocked?: boolean;
}

interface GameGenerationParams {
  type: string;
  difficulty: string;
  language: string;
  category?: string;
  topic?: string;
  estimatedTime?: number;
  customRequirements?: string;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [games, setGames] = useState<CodingGame[]>([]);
  const [currentGame, setCurrentGame] = useState<CodingGame | null>(null);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<GameLeaderboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const loadGames = async (filters?: GameFilters) => {
    if (!user?.isOnboarded) return;
    
    try {
      setLoading(true);
      setLoadingMessage('Loading coding games...');
      
      const { games } = await apiService.getCodingGames(filters);
      setGames(games);
      setLoadingMessage('');
    } catch (error: any) {
      console.error('Failed to load games:', error);
      toast.error('Failed to load coding games');
      setLoadingMessage('');
    } finally {
      setLoading(false);
    }
  };

  const loadGame = async (gameId: string): Promise<CodingGame> => {
    try {
      const { game } = await apiService.getCodingGame(gameId);
      return game;
    } catch (error: any) {
      console.error('Failed to load game:', error);
      toast.error('Failed to load game');
      throw error;
    }
  };

  const startGame = async (gameId: string): Promise<GameSession> => {
    try {
      setLoading(true);
      setLoadingMessage('Starting game...');
      
      const { session } = await apiService.startCodingGame(gameId);
      setCurrentSession(session);
      
      // Load the game details if not already loaded
      if (!currentGame || currentGame.id !== gameId) {
        const game = await loadGame(gameId);
        setCurrentGame(game);
      }
      
      toast.success('Game started! Good luck!');
      return session;
    } catch (error: any) {
      console.error('Failed to start game:', error);
      toast.error('Failed to start game');
      throw error;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const submitGameSolution = async (sessionId: string, code: string): Promise<GameSession> => {
    try {
      setLoading(true);
      setLoadingMessage('Testing your solution...');
      
      const { session } = await apiService.submitGameSolution(sessionId, code);
      setCurrentSession(session);
      
      if (session.status === 'completed') {
        toast.success(`🎉 Congratulations! You earned ${session.score} points!`);
        // Refresh progress after completion
        await loadGameProgress();
      } else if (session.status === 'failed') {
        toast.error('Some tests failed. Keep trying!');
      }
      
      return session;
    } catch (error: any) {
      console.error('Failed to submit solution:', error);
      toast.error('Failed to submit solution');
      throw error;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const useHint = async (sessionId: string, hintIndex: number) => {
    try {
      await apiService.useGameHint(sessionId, hintIndex);
      
      // Update current session
      if (currentSession && currentSession.id === sessionId) {
        setCurrentSession({
          ...currentSession,
          hintsUsed: currentSession.hintsUsed + 1
        });
      }
      
      toast.info('Hint revealed! Remember, using hints affects your score.');
    } catch (error: any) {
      console.error('Failed to use hint:', error);
      toast.error('Failed to get hint');
    }
  };

  const abandonGame = async (sessionId: string) => {
    try {
      await apiService.abandonGame(sessionId);
      setCurrentSession(null);
      setCurrentGame(null);
      toast.info('Game abandoned');
    } catch (error: any) {
      console.error('Failed to abandon game:', error);
      toast.error('Failed to abandon game');
    }
  };

  const loadGameProgress = async () => {
    if (!user?.isOnboarded) return;
    
    try {
      const { progress } = await apiService.getGameProgress();
      setGameProgress(progress);
    } catch (error: any) {
      console.error('Failed to load game progress:', error);
    }
  };

  const loadLeaderboard = async (period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'weekly') => {
    try {
      const { leaderboard } = await apiService.getGameLeaderboard(period);
      setLeaderboard(leaderboard);
    } catch (error: any) {
      console.error('Failed to load leaderboard:', error);
      toast.error('Failed to load leaderboard');
    }
  };

  const generateGame = async (gameParams: GameGenerationParams): Promise<CodingGame> => {
    try {
      setLoading(true);
      setLoadingMessage('Generating your custom game with AI...');
      
      const { game } = await apiService.generateGame(gameParams);
      
      // Refresh the games list to include the new game
      await loadGames();
      
      toast.success(`🎮 New ${gameParams.type.replace('_', ' ')} game created successfully!`);
      return game;
    } catch (error: any) {
      console.error('Failed to generate game:', error);
      toast.error('Failed to generate game. Please try again.');
      throw error;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Load initial data when user is onboarded
  useEffect(() => {
    if (user?.isOnboarded) {
      loadGames();
      loadGameProgress();
    }
  }, [user?.isOnboarded]);

  const value: GameContextType = {
    games,
    currentGame,
    currentSession,
    gameProgress,
    leaderboard,
    loading,
    loadingMessage,
    loadGames,
    loadGame,
    startGame,
    submitGameSolution,
    useHint,
    abandonGame,
    generateGame,
    loadGameProgress,
    loadLeaderboard,
    setCurrentGame,
    setCurrentSession,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};