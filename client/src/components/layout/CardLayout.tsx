import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  BookOpen,
  Home,
  GraduationCap,
  MessageCircle,
  Code,
  Gamepad2,
  User,
  Bell,
  Search,
  ChevronRight,
  Star,
  TrendingUp,
  ArrowLeft,
  LogOut,
  Lightbulb
} from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import NotificationList from '../ui/NotificationList';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    description: 'Overview & Analytics'
  },
  {
    name: 'Learning Paths',
    href: '/learning',
    icon: GraduationCap,
    gradient: 'from-purple-500 via-purple-600 to-pink-600',
    description: 'Structured Learning'
  },
  {
    name: 'AI Chat',
    href: '/chat',
    icon: MessageCircle,
    gradient: 'from-green-500 via-emerald-600 to-teal-600',
    description: 'Interactive Assistant'
  },
  {
    name: 'Code Playground',
    href: '/playground',
    icon: Code,
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    description: 'Practice & Experiment'
  },
  {
    name: 'Coding Games',
    href: '/games',
    icon: Gamepad2,
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    description: 'Learn Through Play'
  },
  {
    name: 'Suggestions',
    href: '/suggestions',
    icon: Lightbulb,
    gradient: 'from-yellow-500 via-amber-500 to-orange-500',
    description: 'Share Your Ideas'
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    gradient: 'from-teal-500 via-cyan-500 to-blue-500',
    description: 'Your Progress'
  },
];

const CardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationListOpen, setNotificationListOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showDashboardContent, setShowDashboardContent] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  // Reset dashboard content view when navigating away from dashboard
  useEffect(() => {
    if (location.pathname !== '/dashboard') {
      setShowDashboardContent(false);
    }
  }, [location.pathname]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/learning') return 'Learning Paths';
    if (path.startsWith('/learning/paths/')) return 'Learning Path';
    if (path.startsWith('/learning/modules/')) return 'Module';
    if (path.startsWith('/learning/topics/')) return 'Topic';
    if (path === '/chat' || path.startsWith('/chat/')) return 'AI Chat';
    if (path === '/playground') return 'Code Playground';
    if (path === '/games') return 'Coding Games';
    if (path === '/profile') return 'Profile';
    if (path === '/settings') return 'Settings';
    return 'Lurn';
  };

  const isHomePage = location.pathname === '/dashboard';
  const showNavigationCards = location.pathname === '/' || location.pathname === '/home' || (location.pathname === '/dashboard' && !showDashboardContent);

  // Determine if we need a back button - show for all pages except dashboard
  const needsBackButton = () => {
    const path = location.pathname;
    return path !== '/dashboard';
  };

  const getBackPath = () => {
    const path = location.pathname;

    // For learning sub-pages, go back to learning main page
    if (path.startsWith('/learning/paths/')) return '/learning';
    if (path.startsWith('/learning/modules/')) return '/learning';
    if (path.startsWith('/learning/topics/')) return '/learning';

    // For chat sub-pages, go back to chat main page
    if (path.startsWith('/chat/')) return '/chat';

    // For all main pages (learning, chat, playground, games, profile, settings), go back to dashboard
    if (path === '/learning' || path === '/chat' || path === '/playground' ||
      path === '/games' || path === '/profile' || path === '/settings') {
      return '/dashboard';
    }

    // Default fallback to dashboard
    return '/dashboard';
  };

  const getBackButtonText = () => {
    const path = location.pathname;

    // For learning sub-pages
    if (path.startsWith('/learning/paths/') || path.startsWith('/learning/modules/') || path.startsWith('/learning/topics/')) {
      return 'Back to Learning';
    }

    // For chat sub-pages
    if (path.startsWith('/chat/')) {
      return 'Back to Chat';
    }

    // For main pages, go back to dashboard
    if (path === '/learning' || path === '/chat' || path === '/playground' ||
      path === '/games' || path === '/profile' || path === '/settings') {
      return 'Back to Dashboard';
    }

    return 'Back';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      {/* Top Navigation Bar */}
      <motion.header
        className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Brand */}
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="p-2 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-lg"
              >
                <BookOpen className="h-8 w-8 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold font-display text-foreground">
                  Lurn
                </h1>
                <p className="text-xs text-muted-foreground">Intelligent Learning Platform</p>
              </div>
            </motion.div>

            {/* Center Search */}
            <motion.div
              className="flex-1 max-w-md mx-8"
              animate={{ scale: searchFocused ? 1.02 : 1 }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search courses, topics, or ask AI..."
                  className="w-full bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300 placeholder-muted-foreground"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-2 py-1 text-xs font-mono text-muted-foreground bg-muted/50 rounded border">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </motion.div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />

              {/* Notifications */}
              <div className="relative">
                <motion.button
                  className="relative p-3 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotificationListOpen(!notificationListOpen)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <motion.span
                      className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </motion.button>

                <NotificationList
                  isOpen={notificationListOpen}
                  onClose={() => setNotificationListOpen(false)}
                  notifications={notifications}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onClearAll={clearAll}
                  triggerRef={null}
                />
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-2">
                <motion.div
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer border border-border/50"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="relative">
                    {user?.avatar ? (
                      <img
                        className="h-10 w-10 rounded-full ring-2 ring-primary/20"
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/30 border border-border flex items-center justify-center shadow-lg">
                        <span className="text-foreground font-bold">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-card">
                      <div className="h-full w-full bg-green-400 rounded-full animate-ping opacity-75" />
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </motion.div>

                {/* Logout Button */}
                <motion.button
                  onClick={logout}
                  className="p-2 rounded-xl text-muted-foreground hover:text-error-400 hover:bg-error-500/10 transition-all duration-300 border border-transparent hover:border-error-500/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {showNavigationCards ? (
          /* Navigation Cards for Home */
          <div className="space-y-6">
            {/* Welcome Section */}
            <motion.div
              className="text-center space-y-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold font-display text-foreground">
                Welcome back, {user?.firstName}!
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Continue your learning journey with AI-powered guidance and interactive experiences.
              </p>
            </motion.div>

            {/* Navigation Cards Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {navigation.map((item, index) => {
                const isActive = location.pathname === item.href ||
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

                return (
                  <motion.div
                    key={item.name}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    onHoverStart={() => setHoveredCard(item.name)}
                    onHoverEnd={() => setHoveredCard(null)}
                  >
                    {item.name === 'Dashboard' ? (
                      <button
                        onClick={() => setShowDashboardContent(true)}
                        className="block group w-full text-left"
                      >
                        <div className={`relative p-6 rounded-2xl border transition-all duration-300 overflow-hidden ${isActive
                            ? 'bg-card border-primary/50 shadow-lg shadow-primary/10'
                            : 'bg-card/50 border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
                          }`}>
                          {/* Background Gradient */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                          {/* Content */}
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                              <motion.div
                                className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg`}
                                animate={hoveredCard === item.name ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <item.icon className="h-6 w-6 text-white" />
                              </motion.div>

                              <motion.div
                                animate={hoveredCard === item.name ? { x: 5 } : { x: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </motion.div>
                            </div>

                            <h3 className="text-lg font-semibold font-display mb-2 group-hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              {item.description}
                            </p>

                            {/* Progress or Status Indicator */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-xs text-muted-foreground">Featured</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-green-500">Active</span>
                              </div>
                            </div>
                          </div>

                          {/* Hover Effect */}
                          <AnimatePresence>
                            {hoveredCard === item.name && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      </button>
                    ) : (
                      <NavLink
                        to={item.href}
                        className="block group"
                      >
                        <div className={`relative p-6 rounded-2xl border transition-all duration-300 overflow-hidden ${isActive
                            ? 'bg-card border-primary/50 shadow-lg shadow-primary/10'
                            : 'bg-card/50 border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
                          }`}>
                          {/* Background Gradient */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                          {/* Content */}
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                              <motion.div
                                className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg`}
                                animate={hoveredCard === item.name ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <item.icon className="h-6 w-6 text-white" />
                              </motion.div>

                              <motion.div
                                animate={hoveredCard === item.name ? { x: 5 } : { x: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </motion.div>
                            </div>

                            <h3 className="text-lg font-semibold font-display mb-2 group-hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              {item.description}
                            </p>

                            {/* Progress or Status Indicator */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-xs text-muted-foreground">Featured</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-green-500">Active</span>
                              </div>
                            </div>
                          </div>

                          {/* Hover Effect */}
                          <AnimatePresence>
                            {hoveredCard === item.name && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      </NavLink>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Quick AI Chat</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Get instant help with your coding questions
                </p>
                <NavLink
                  to="/chat"
                  className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium"
                >
                  <span>Start chatting</span>
                  <ChevronRight className="h-4 w-4" />
                </NavLink>
              </div>

              <div className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Code className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Code Playground</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Practice coding in a safe environment
                </p>
                <NavLink
                  to="/playground"
                  className="inline-flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium"
                >
                  <span>Start coding</span>
                  <ChevronRight className="h-4 w-4" />
                </NavLink>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Regular Page Content */
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {isHomePage && showDashboardContent ? (
              /* Dashboard Content - render with back to cards button */
              <>
                <motion.button
                  onClick={() => setShowDashboardContent(false)}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors mb-4 group"
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="h-4 w-4 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Back to Home</span>
                </motion.button>
                <Outlet />
              </>
            ) : (
              /* Other Pages - render with header and back button */
              <>
                <div className="">
                  {/* Back Button */}
                  {needsBackButton() && (
                    <motion.button
                      onClick={() => navigate(getBackPath())}
                      className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors mb-4 group"
                      whileHover={{ x: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ArrowLeft className="h-4 w-4 group-hover:text-primary transition-colors" />
                      <span className="text-sm font-medium">{getBackButtonText()}</span>
                    </motion.button>
                  )}

                  <div className="h-1 w-16 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
                </div>
                <Outlet />
              </>
            )}
          </motion.div>
        )}
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/3 rounded-full blur-3xl animate-pulse animation-delay-1000" />
      </div>
    </div>
  );
};

export default CardLayout;