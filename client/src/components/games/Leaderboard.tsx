import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star, 
  TrendingUp,
  Calendar,
  Users,
  Award,
  Zap,
  Target,
  Clock,
  Filter
} from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { logDiagnostics } from '../../utils/diagnostics';

interface LeaderboardProps {
  compact?: boolean;
  showPeriodSelector?: boolean;
  maxEntries?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  compact = false,
  showPeriodSelector = true,
  maxEntries = 50
}) => {
  const { user } = useAuth();
  const { leaderboard, loading, loadLeaderboard, retryLeaderboard } = useGame();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('weekly');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLeaderboard(selectedPeriod);
  }, [selectedPeriod, loadLeaderboard]);

  const periods = [
    { value: 'daily', label: 'Today', icon: Calendar },
    { value: 'weekly', label: 'This Week', icon: Calendar },
    { value: 'monthly', label: 'This Month', icon: Calendar },
    { value: 'all_time', label: 'All Time', icon: Trophy }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
            {rank}
          </div>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-background border border-border';
    }
  };

  const getUserRank = () => {
    if (!leaderboard || !user) return null;
    return leaderboard.entries.find(entry => entry.userId === user.id);
  };

  const userRank = getUserRank();

  if (loading && !leaderboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading leaderboard..." />
      </div>
    );
  }

  // Show empty state if leaderboard exists but has no entries
  if (leaderboard && leaderboard.entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {leaderboard.error ? 'Leaderboard Unavailable' : 'No Rankings Yet'}
        </h3>
        <p className="text-muted-foreground mb-4">
          {leaderboard.error 
            ? 'There was an issue loading the leaderboard. Please try again.'
            : 'Be the first to complete a coding game and claim the top spot!'
          }
        </p>
        {leaderboard.error && (
          <p className="text-sm text-red-600 mb-4 max-w-md">
            {leaderboard.error}
          </p>
        )}
        <div className="flex space-x-2">
          <Button
            onClick={retryLeaderboard}
            variant="outline"
            size="sm"
          >
            {leaderboard.error ? 'Retry' : 'Refresh Leaderboard'}
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={logDiagnostics}
              variant="outline"
              size="sm"
            >
              Run Diagnostics
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Top Players
          </h3>
          {showPeriodSelector && (
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="text-sm border border-border rounded-lg px-2 py-1 bg-background"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          {leaderboard?.entries.slice(0, 5).map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                entry.userId === user?.id ? 'bg-primary-50 border border-primary-200' : 'bg-muted'
              }`}
            >
              <div className="flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {entry.userName}
                  {entry.userId === user?.id && (
                    <span className="ml-2 text-xs text-primary-600">(You)</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry.score} points • {entry.gamesCompleted} games
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {userRank && userRank.rank > 5 && (
          <div className="border-t border-border pt-2">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary-50 border border-primary-200">
              <div className="flex-shrink-0">
                {getRankIcon(userRank.rank)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {userRank.userName} (You)
                </div>
                <div className="text-xs text-muted-foreground">
                  {userRank.score} points • {userRank.gamesCompleted} games
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Leaderboard</h2>
            <p className="text-muted-foreground">
              See how you rank against other players
            </p>
          </div>
        </div>

        {showPeriodSelector && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter className="h-4 w-4" />}
            >
              Period
            </Button>
          </div>
        )}
      </div>

      {/* Period Selector */}
      <AnimatePresence>
        {showFilters && showPeriodSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {periods.map((period) => {
                const IconComponent = period.icon;
                return (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value as any)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedPeriod === period.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-border hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <span className="font-medium">{period.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="flex justify-center mb-2">
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {leaderboard?.entries.length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Total Players</div>
        </div>

        <div className="card p-4 text-center">
          <div className="flex justify-center mb-2">
            <Star className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {leaderboard?.entries[0]?.score || 0}
          </div>
          <div className="text-sm text-muted-foreground">Top Score</div>
        </div>

        <div className="card p-4 text-center">
          <div className="flex justify-center mb-2">
            <Target className="h-6 w-6 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {Math.round((leaderboard?.entries.reduce((sum, entry) => sum + entry.score, 0) || 0) / (leaderboard?.entries.length || 1))}
          </div>
          <div className="text-sm text-muted-foreground">Avg Score</div>
        </div>

        <div className="card p-4 text-center">
          <div className="flex justify-center mb-2">
            <TrendingUp className="h-6 w-6 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {userRank?.rank || '-'}
          </div>
          <div className="text-sm text-muted-foreground">Your Rank</div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard && leaderboard.entries.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-center">🏆 Top 3 Champions</h3>
          
          <div className="flex items-end justify-center space-x-4">
            {/* Second Place */}
            {leaderboard.entries[1] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="w-20 h-16 bg-gradient-to-t from-gray-300 to-gray-500 rounded-t-lg flex items-end justify-center pb-2">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div className="mt-2">
                  <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto mb-2 flex items-center justify-center">
                    <Medal className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="font-medium text-sm">{leaderboard.entries[1].userName}</div>
                  <div className="text-xs text-muted-foreground">{leaderboard.entries[1].score} pts</div>
                </div>
              </motion.div>
            )}

            {/* First Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-24 h-20 bg-gradient-to-t from-yellow-400 to-yellow-600 rounded-t-lg flex items-end justify-center pb-2">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <div className="mt-2">
                <div className="w-16 h-16 rounded-full bg-yellow-100 mx-auto mb-2 flex items-center justify-center">
                  <Crown className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="font-bold text-base">{leaderboard.entries[0].userName}</div>
                <div className="text-sm text-yellow-600 font-medium">{leaderboard.entries[0].score} pts</div>
              </div>
            </motion.div>

            {/* Third Place */}
            {leaderboard.entries[2] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="w-18 h-12 bg-gradient-to-t from-amber-400 to-amber-600 rounded-t-lg flex items-end justify-center pb-2">
                  <span className="text-white font-bold">3</span>
                </div>
                <div className="mt-2">
                  <div className="w-10 h-10 rounded-full bg-amber-100 mx-auto mb-2 flex items-center justify-center">
                    <Medal className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="font-medium text-sm">{leaderboard.entries[2].userName}</div>
                  <div className="text-xs text-muted-foreground">{leaderboard.entries[2].score} pts</div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Full Leaderboard */}
      <div className="card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Full Rankings
          </h3>
        </div>

        <div className="divide-y divide-border">
          {leaderboard?.entries.slice(0, maxEntries).map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 hover:bg-muted/50 transition-colors ${
                entry.userId === user?.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-foreground">
                      {entry.userName}
                    </span>
                    {entry.userId === user?.id && (
                      <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {entry.gamesCompleted} games completed
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">
                    {entry.score}
                  </div>
                  <div className="text-xs text-muted-foreground">points</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {leaderboard && leaderboard.entries.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No players yet for this period.</p>
            <p className="text-sm">Be the first to play and claim the top spot!</p>
          </div>
        )}
      </div>

      {/* Your Position (if not in top entries) */}
      {userRank && userRank.rank > maxEntries && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 border-l-4 border-l-primary-500 bg-primary-50"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {getRankIcon(userRank.rank)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">
                Your Position
              </div>
              <div className="text-sm text-muted-foreground">
                {userRank.score} points • {userRank.gamesCompleted} games completed
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary-600">
                #{userRank.rank}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Leaderboard;