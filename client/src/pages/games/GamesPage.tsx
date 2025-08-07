import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Gamepad2,
  Trophy,
  Clock,
  Star,
  Filter,
  Search,
  Play,
  Lock,
  Zap,
  Target,
  Code,
  Bug,
  Puzzle,
  Timer,
  Award,
  TrendingUp,
  Users,
  ChevronRight,
  Sparkles,
  Plus,
  Wand2
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Leaderboard from '../../components/games/Leaderboard';
import GameProgressDashboard from '../../components/games/GameProgressDashboard';
import GameGeneratorModal from '../../components/games/GameGeneratorModal';
import { CodingGame } from '../../types';

const gameTypeIcons = {
  code_challenge: Code,
  bug_hunt: Bug,
  code_completion: Puzzle,
  syntax_puzzle: Target,
  algorithm_race: Timer,
};

const difficultyColors = {
  easy: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  medium: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
  hard: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
};

const GamesPage: React.FC = () => {
  const { user } = useAuth();
  const {
    games,
    gameProgress,
    leaderboard,
    loading,
    loadingMessage,
    loadGames,
    loadGameProgress,
    loadLeaderboard,
    startGame
  } = useGame();

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'games' | 'progress' | 'leaderboard'>('games');
  const [showGameGenerator, setShowGameGenerator] = useState(false);

  useEffect(() => {
    loadGames();
    loadGameProgress();
    loadLeaderboard();
  }, []);

  // Function to seed sample games if none exist
  const seedSampleGames = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseURL}/games/admin/seed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Reload games after seeding
        await loadGames();
        console.log('Sample games seeded successfully');
      } else {
        console.error('Failed to seed games:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to seed sample games:', error);
    }
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'all' || game.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || game.difficulty === selectedDifficulty;
    const matchesLanguage = selectedLanguage === 'all' || game.language === selectedLanguage;

    return matchesSearch && matchesType && matchesDifficulty && matchesLanguage;
  });

  const handleStartGame = async (gameId: string) => {
    try {
      await startGame(gameId);
      navigate(`/games/play/${gameId}`);
    } catch (error) {
      // Error is handled in the context
    }
  };

  const getGameTypeIcon = (type: string) => {
    const IconComponent = gameTypeIcons[type as keyof typeof gameTypeIcons] || Code;
    return IconComponent;
  };

  const getGameTypeLabel = (type: string) => {
    const labels = {
      code_challenge: 'Code Challenge',
      bug_hunt: 'Bug Hunt',
      code_completion: 'Code Completion',
      syntax_puzzle: 'Syntax Puzzle',
      algorithm_race: 'Algorithm Race',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const uniqueLanguages = [...new Set(games.map(game => game.language))];

  if (loading && games.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" variant="cyber" text={loadingMessage || "Loading games..."} />
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600/90 via-primary-700/90 to-primary-800/90 p-8 text-white shadow-2xl border border-primary-500/20"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-primary-400/8 animate-pulse-slow" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary-400/10 animate-float" />
          <div className="absolute top-1/2 right-1/4 h-16 w-16 rounded-full bg-primary-400/12 animate-bounce-gentle" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/5 to-transparent" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center space-x-3 mb-2">
                <Gamepad2 className="h-8 w-8" />
                <h1 className="text-3xl font-bold font-display cyber-text">
                  Coding Games
                </h1>
              </div>
              <p className="text-primary-100 font-robotic text-lg">
                Level up your coding skills with <span className="text-primary-200 font-semibold">interactive challenges</span>
              </p>
            </motion.div>

            <motion.div
              className="flex items-center space-x-4 flex-wrap"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                variant="cyber"
                size="md"
                icon={<Wand2 className="h-4 w-4" />}
                onClick={() => setShowGameGenerator(true)}
                className="bg-gradient-to-r from-blue-600/90 to-indigo-600/90 shadow-lg backdrop-blur-sm border border-blue-500/20"
              >
                AI Generator
              </Button>
              <Button
                variant="outline"
                size="md"
                icon={<Play className="h-4 w-4" />}
                className='border-white/30 text-white hover:bg-white/20 hover:text-white shadow-md'
                onClick={() => {
                  // Find the first unlocked game and start it
                  const firstUnlockedGame = games.find(game => game.isUnlocked);
                  if (firstUnlockedGame) {
                    handleStartGame(firstUnlockedGame.id);
                  } else {
                    // If no games are unlocked, show a message or redirect to create games
                    console.log('No games available for quick play');
                  }
                }}
              >
                Quick Play
              </Button>
              <Button
                variant="outline"
                size="md"
                className='border-white/30 text-white hover:bg-white/20 hover:text-white shadow-md'
                icon={<Trophy className="h-4 w-4" />}
                onClick={() => setActiveTab('leaderboard')}
              >
                Leaderboard
              </Button>
            </motion.div>
          </div>

          {gameProgress && (
            <motion.div
              className="hidden md:block"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center space-x-8">
                <motion.div
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-3xl font-bold font-display neon-text">
                    {gameProgress.totalPoints}
                  </div>
                  <div className="text-sm text-primary-200 font-robotic">Total Points</div>
                  <div className="mt-1 h-1 w-16 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full mx-auto" />
                </motion.div>

                <motion.div
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-3xl font-bold font-display neon-text">
                    {gameProgress.totalGamesCompleted}
                  </div>
                  <div className="text-sm text-primary-200 font-robotic">Games Won</div>
                  <div className="mt-1 h-1 w-16 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full mx-auto" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'games', label: 'Games', icon: Gamepad2 },
          { id: 'progress', label: 'Progress', icon: TrendingUp },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'games' && (
          <motion.div
            key="games"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                icon={<Filter className="h-4 w-4" />}
              >
                Filters
              </Button>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="card p-4 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Game Type</label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full p-2 border border-border rounded-lg bg-background"
                      >
                        <option value="all">All Types</option>
                        <option value="code_challenge">Code Challenge</option>
                        <option value="bug_hunt">Bug Hunt</option>
                        <option value="code_completion">Code Completion</option>
                        <option value="syntax_puzzle">Syntax Puzzle</option>
                        <option value="algorithm_race">Algorithm Race</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Difficulty</label>
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="w-full p-2 border border-border rounded-lg bg-background"
                      >
                        <option value="all">All Difficulties</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Language</label>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="w-full p-2 border border-border rounded-lg bg-background"
                      >
                        <option value="all">All Languages</option>
                        {uniqueLanguages.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGames.map((game, index) => {
                const IconComponent = getGameTypeIcon(game.type);

                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`card-cyber group hover:shadow-glow-lg transition-all duration-300 ${!game.isUnlocked ? 'opacity-60' : ''
                      }`}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <div className="card-content p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-white">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-card-foreground group-hover:text-primary-600 transition-colors">
                              {game.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {getGameTypeLabel(game.type)}
                            </p>
                          </div>
                        </div>

                        {!game.isUnlocked && (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {game.description}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[game.difficulty]
                            }`}>
                            {game.difficulty}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {game.language}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{game.estimatedTime}m</span>
                          <Star className="h-3 w-3 text-primary-500" />
                          <span>{game.points}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {game.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-muted text-xs rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                          {game.tags.length > 2 && (
                            <span className="px-2 py-1 bg-muted text-xs rounded-md">
                              +{game.tags.length - 2}
                            </span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant={game.isUnlocked ? "default" : "outline"}
                          disabled={!game.isUnlocked}
                          onClick={() => handleStartGame(game.id)}
                          icon={<Play className="h-3 w-3" />}
                          className={game.isUnlocked ? "bg-primary-600 hover:bg-primary-700 text-white shadow-md" : ""}
                        >
                          {game.isUnlocked ? 'Play' : 'Locked'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredGames.length === 0 && (
              <div className="text-center py-12">
                <Gamepad2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {games.length === 0 ? 'No games available' : 'No games found'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {games.length === 0
                    ? 'Get started by loading some sample games'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {games.length === 0 && (
                  <Button
                    onClick={seedSampleGames}
                    icon={<Plus className="h-4 w-4" />}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load Sample Games'}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'progress' && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GameProgressDashboard />
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Leaderboard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Game Generator Modal */}
      <GameGeneratorModal
        isOpen={showGameGenerator}
        onClose={() => setShowGameGenerator(false)}
        onGameGenerated={(gameId) => {
          // Optionally navigate to the generated game
          console.log('Game generated with ID:', gameId);
        }}
      />
    </motion.div>
  );
};

export default GamesPage;