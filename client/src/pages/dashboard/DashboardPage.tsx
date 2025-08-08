import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useLearning } from '../../contexts/LearningContext';
import { useCodePlayground } from '../../contexts/CodePlaygroundContext';
import type { UserStats } from '../../types';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import FeatureTest from '../../components/test/FeatureTest';
import TestNotificationButton from '../../components/ui/TestNotificationButton';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Play, 
  MessageCircle,
  Plus,
  Target,
  Settings,
  Zap,
  Brain,
  Code,
  Sparkles,
  Activity,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { safeFormatDateWithPrefix } from '../../utils/dateUtils';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { learningPaths, loading: learningLoading } = useLearning();
  const { playgrounds } = useCodePlayground();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { stats } = await apiService.getUserStats();
        setStats(stats);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (user?.isOnboarded) {
      loadStats();
    }

    // Listen for progress updates
    const handleProgressUpdate = () => {
      if (user?.isOnboarded) {
        loadStats();
      }
    };

    window.addEventListener('userProgressUpdated', handleProgressUpdate);

    return () => {
      window.removeEventListener('userProgressUpdated', handleProgressUpdate);
    };
  }, [user?.isOnboarded]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getActiveLearningPaths = () => {
    // Include both in_progress and not_started paths that have been started
    return learningPaths.filter(path => {
      // Always include in_progress paths
      if (path.status === 'in_progress') return true;
      
      // Include not_started paths with any progress
      if (path.status === 'not_started' && path.progress && path.progress.percentageComplete > 0) return true;
      
      // Include paths with at least one available or in-progress module
      if (path.modules && path.modules.some(module => 
        module.status === 'available' || 
        module.status === 'in_progress' || 
        module.status === 'completed'
      )) return true;
      
      return false;
    }).slice(0, 3); // Limit to 3 for better UI
  };

  const getRecentLearningPaths = () => {
    return learningPaths
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  };

  if (statsLoading || learningLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" variant="cyber" text="Loading Dashboard..." />
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
      {/* Welcome Section */}
      <motion.div 
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600/90 via-primary-700/90 to-primary-800/90 p-8 text-white shadow-2xl border border-primary-500/20"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/5 animate-pulse-slow" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary-400/10 animate-float" />
          <div className="absolute top-1/2 right-1/4 h-16 w-16 rounded-full bg-primary-400/15 animate-bounce-gentle" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-3xl font-bold font-display text-white">
                {getGreeting()}, {user?.firstName}! 
                <motion.span
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="inline-block ml-2"
                >
                  👋
                </motion.span>
              </h1>
              <p className="mt-2 text-primary-100 font-medium text-lg">
                Ready to <span className="text-primary-200 font-semibold">advance</span> your learning journey?
              </p>
            </motion.div>

            <motion.div
              className="flex items-center space-x-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link to="/chat">
                <Button variant="primary" size="md" icon={<Brain className="h-4 w-4" />} className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                  AI Chat
                </Button>
              </Link>
              <Link to="/playground">
                <Button variant="outline" size="md" icon={<Code className="h-4 w-4" />} className="border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                  Playground
                </Button>
              </Link>
            </motion.div>
          </div>

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
                <div className="text-3xl font-bold font-display text-primary-200">
                  {stats?.streakDays || 0}
                </div>
                <div className="text-sm text-primary-100 font-medium">Day Streak</div>
                <div className="mt-1 h-1 w-16 bg-gradient-to-r from-primary-300 to-primary-400 rounded-full mx-auto" />
              </motion.div>
              
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl font-bold font-display text-primary-200">
                  {learningPaths.length}
                </div>
                <div className="text-sm text-primary-100 font-medium">Learning Paths</div>
                <div className="mt-1 h-1 w-16 bg-gradient-to-r from-primary-300 to-primary-400 rounded-full mx-auto" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 bg-white/40 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {[
          {
            title: 'Total Modules',
            value: stats?.totalModulesCompleted || 0,
            icon: BookOpen,
            color: 'text-primary-400',
            bgColor: 'from-primary-500/20 to-primary-600/20',
            borderColor: 'border-primary-500/30',
          },
          {
            title: 'Time Spent',
            value: `${Math.round((stats?.totalTimeSpent || 0) / 60)}h`,
            icon: Clock,
            color: 'text-success-400',
            bgColor: 'from-success-500/20 to-success-600/20',
            borderColor: 'border-success-500/30',
          },
          {
            title: 'Streak Days',
            value: stats?.streakDays || 0,
            icon: Trophy,
            color: 'text-warning-400',
            bgColor: 'from-warning-500/20 to-warning-600/20',
            borderColor: 'border-warning-500/30',
          },
          {
            title: 'Learning Paths',
            value: learningPaths.length,
            icon: TrendingUp,
            color: 'text-accent-400',
            bgColor: 'from-accent-500/20 to-accent-600/20',
            borderColor: 'border-accent-500/30',
          },
          {
            title: 'Code Playgrounds',
            value: playgrounds.length,
            icon: Code,
            color: 'text-purple-400',
            bgColor: 'from-purple-500/20 to-purple-600/20',
            borderColor: 'border-purple-500/30',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            className={`card-cyber bg-gradient-to-br ${stat.bgColor} ${stat.borderColor} group hover:shadow-glow-lg transition-all duration-300`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * (index + 3) }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="card-content p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium font-robotic text-muted-foreground tracking-wide">
                    {stat.title}
                  </p>
                  <motion.p 
                    className="text-3xl font-bold font-display text-card-foreground"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    {stat.value}
                  </motion.p>
                </div>
                
                <motion.div
                  className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-card to-accent/10 ${stat.color} group-hover:scale-110 transition-transform duration-300`}
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    repeatDelay: 2,
                    delay: index * 0.5 
                  }}
                >
                  <stat.icon className="h-8 w-8" />
                </motion.div>
              </div>

              {/* Animated progress indicator */}
              <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${stat.bgColor.replace('/20', '/60')}`}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, delay: 0.2 * (index + 1) }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2">
          <div className="card h">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="card-title">Continue Learning</h3>
                <Link
                  to="/learning"
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="card-content">
              {getActiveLearningPaths().length > 0 ? (
                <div className="space-y-4">
                  {getActiveLearningPaths().slice(0, 3).map((path) => (
                    <div
                      key={path.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-card-foreground">{path.title}</h4>
                          <p className="text-sm text-muted-foreground">{path.subject}</p>
                          <div className="mt-1">
                            <div className="flex items-center space-x-2">
                              <div className="progress-bar w-32">
                                <div 
                                  className="progress-fill"
                                  style={{ width: `${path.progress.percentageComplete}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {path.progress.percentageComplete}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Link
                        to={`/learning/paths/${path.id}`}
                        className="btn-primary btn-sm flex items-center space-x-1"
                      >
                        <Play className="h-3 w-3" />
                        <span>Continue</span>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-card-foreground mb-2">
                    No active learning paths
                  </h4>
                  <p className="text-muted-foreground mb-4">
                    Start a new learning path to begin your journey
                  </p>
                  <Link to="/learning" className="btn-primary p-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Start Learning
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Quick Chat */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="card-content space-y-3">
              <Link
                to="/chat"
                className="flex items-center p-3 border border-border rounded-lg hover:border-primary-300 transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-3" />
                <div>
                  <div className="font-medium text-card-foreground">Ask Lurn</div>
                  <div className="text-sm text-muted-foreground">Get instant help</div>
                </div>
              </Link>

              <Link
                to="/learning"
                className="flex items-center p-3 border border-border rounded-lg hover:border-primary-300 transition-colors"
              >
                <Plus className="h-5 w-5 text-success-600 dark:text-success-400 mr-3" />
                <div>
                  <div className="font-medium text-card-foreground">New Learning Path</div>
                  <div className="text-sm text-muted-foreground">Start learning something new</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
            </div>
            <div className="card-content">
              {getRecentLearningPaths().length > 0 ? (
                <div className="space-y-3">
                  {getRecentLearningPaths().map((path) => (
                    <div key={path.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">
                          {path.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {safeFormatDateWithPrefix(path.createdAt, path.updatedAt, 'MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Progress Chart */}
        {learningPaths.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Learning Progress Overview</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {learningPaths.slice(0, 5).map((path) => (
                  <div key={path.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-card-foreground">
                          {path.title}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {path.progress.percentageComplete}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${path.progress.percentageComplete}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Playgrounds */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title">Recent Playgrounds</h3>
              <Link
                to="/playground"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="card-content">
            {playgrounds.length > 0 ? (
              <div className="space-y-3">
                {playgrounds.slice(0, 5).map((playground) => (
                  <div
                    key={playground.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Code className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-card-foreground">
                          {playground.language.charAt(0).toUpperCase() + playground.language.slice(1)} Playground
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {playground.code.length} characters
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/playground"
                      className="btn-outline btn-sm"
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium text-card-foreground mb-2">
                  No playgrounds yet
                </h4>
                <p className="text-muted-foreground mb-4">
                  Create your first code playground to start experimenting
                </p>
                <Link to="/playground" className="btn-primary btn-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Playground
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;