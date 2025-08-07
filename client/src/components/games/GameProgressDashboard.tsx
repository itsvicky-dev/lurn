import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Target, 
  TrendingUp,
  Calendar,
  Clock,
  Award,
  Zap,
  Brain,
  Code,
  Gamepad2,
  CheckCircle,
  Lock,
  Flame,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

interface GameProgressDashboardProps {
  compact?: boolean;
}

const GameProgressDashboard: React.FC<GameProgressDashboardProps> = ({ compact = false }) => {
  const { user } = useAuth();
  const { gameProgress, loading, loadGameProgress } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadGameProgress();
  }, [loadGameProgress]);

  if (loading && !gameProgress) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading your progress..." />
      </div>
    );
  }

  if (!gameProgress) {
    return (
      <div className="text-center p-8">
        <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Progress Yet</h3>
        <p className="text-muted-foreground">Start playing games to see your progress here!</p>
      </div>
    );
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return 'text-red-500';
    if (streak >= 3) return 'text-orange-500';
    if (streak >= 1) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-500';
    if (rate >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'streak': return <Flame className="h-4 w-4" />;
      case 'completion': return <CheckCircle className="h-4 w-4" />;
      case 'score': return <Star className="h-4 w-4" />;
      case 'speed': return <Zap className="h-4 w-4" />;
      case 'language': return <Code className="h-4 w-4" />;
      case 'category': return <Target className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{gameProgress.totalPoints}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{gameProgress.totalGamesCompleted}</div>
            <div className="text-sm text-muted-foreground">Games Won</div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="card p-4">
          <h4 className="font-semibold mb-3 flex items-center">
            <Award className="h-4 w-4 mr-2" />
            Recent Achievements
          </h4>
          <div className="space-y-2">
            {gameProgress.achievements
              .filter(a => a.isUnlocked)
              .slice(0, 3)
              .map((achievement, index) => (
                <div key={achievement.id} className="flex items-center space-x-2">
                  <div className="text-yellow-500">
                    {getAchievementIcon(achievement.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{achievement.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{achievement.description}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
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
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your Progress</h2>
            <p className="text-muted-foreground">
              Track your gaming achievements and improvement
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 text-center"
        >
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Trophy className="h-6 w-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {gameProgress.totalPoints}
          </div>
          <div className="text-sm text-muted-foreground">Total Points</div>
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${Math.min((gameProgress.totalPoints / 5000) * 100, 100)}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 text-center"
        >
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Target className="h-6 w-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {gameProgress.totalGamesCompleted}
          </div>
          <div className="text-sm text-muted-foreground">Games Completed</div>
          <div className="text-xs text-green-600 mt-1">
            {gameProgress.completionRate.toFixed(1)}% completion rate
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6 text-center"
        >
          <div className="flex justify-center mb-3">
            <div className={`p-3 rounded-full ${
              gameProgress.streakDays >= 3 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
            }`}>
              <Flame className="h-6 w-6" />
            </div>
          </div>
          <div className={`text-3xl font-bold mb-1 ${getStreakColor(gameProgress.streakDays)}`}>
            {gameProgress.streakDays}
          </div>
          <div className="text-sm text-muted-foreground">Day Streak</div>
          {gameProgress.streakDays >= 3 && (
            <div className="text-xs text-orange-600 mt-1">🔥 On fire!</div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6 text-center"
        >
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Star className="h-6 w-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {gameProgress.averageScore.toFixed(0)}
          </div>
          <div className="text-sm text-muted-foreground">Average Score</div>
          <div className="text-xs text-purple-600 mt-1">
            {gameProgress.favoriteLanguage || 'No favorite yet'}
          </div>
        </motion.div>
      </div>

      {/* Category Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Category Progress
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gameProgress.categoryProgress.map((category, index) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="p-4 bg-muted rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground">{category.category}</h4>
                <div className="text-sm text-muted-foreground">
                  {category.completedGames}/{category.totalGames}
                </div>
              </div>
              
              <div className="mb-2 h-2 bg-background rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000"
                  style={{ 
                    width: `${category.totalGames > 0 ? (category.completedGames / category.totalGames) * 100 : 0}%` 
                  }}
                />
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {category.totalPoints} points
                </span>
                <span className="text-muted-foreground">
                  Avg: {category.averageScore.toFixed(0)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {gameProgress.categoryProgress.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No category progress yet.</p>
            <p className="text-sm">Complete games to see your progress by category!</p>
          </div>
        )}
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Achievements
          </h3>
          <div className="text-sm text-muted-foreground">
            {gameProgress.achievements.filter(a => a.isUnlocked).length} / {gameProgress.achievements.length} unlocked
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gameProgress.achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * index }}
              className={`p-4 rounded-lg border-2 transition-all ${
                achievement.isUnlocked
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-border bg-muted opacity-60'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  achievement.isUnlocked 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {achievement.isUnlocked ? (
                    getAchievementIcon(achievement.type)
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-foreground truncate">
                      {achievement.title}
                    </h4>
                    {achievement.isUnlocked && (
                      <div className="text-lg">{achievement.icon}</div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {achievement.description}
                  </p>
                  
                  {!achievement.isUnlocked && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.requirement}</span>
                      </div>
                      <div className="h-1 bg-background rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000"
                          style={{ 
                            width: `${Math.min((achievement.progress / achievement.requirement) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {achievement.isUnlocked && achievement.unlockedAt && (
                    <div className="text-xs text-green-600">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {gameProgress.achievements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No achievements available yet.</p>
            <p className="text-sm">Keep playing to unlock achievements!</p>
          </div>
        )}
      </motion.div>

      {/* Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Performance Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Completion Rate</span>
              </div>
              <span className={`text-sm font-bold ${getCompletionRateColor(gameProgress.completionRate)}`}>
                {gameProgress.completionRate.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Average Score</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {gameProgress.averageScore.toFixed(0)} pts
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Favorite Language</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {gameProgress.favoriteLanguage || 'None yet'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">🎯 Next Goal</h4>
              <p className="text-sm text-blue-800">
                {gameProgress.totalPoints < 1000 
                  ? `Earn ${1000 - gameProgress.totalPoints} more points to reach 1000!`
                  : gameProgress.streakDays < 7
                  ? `Play for ${7 - gameProgress.streakDays} more days to get a week streak!`
                  : 'Keep up the great work! You\'re doing amazing!'
                }
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">💡 Tip</h4>
              <p className="text-sm text-green-800">
                {gameProgress.completionRate < 60
                  ? 'Try easier games first to build confidence and improve your completion rate!'
                  : gameProgress.streakDays === 0
                  ? 'Play daily to build a streak and unlock streak achievements!'
                  : 'Challenge yourself with harder games to earn more points!'
                }
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameProgressDashboard;