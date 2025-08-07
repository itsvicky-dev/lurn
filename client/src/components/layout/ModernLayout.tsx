import React, { useState } from 'react';
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
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import NotificationList from '../ui/NotificationList';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'from-blue-500 to-cyan-500' },
  { name: 'Learning', href: '/learning', icon: GraduationCap, color: 'from-purple-500 to-pink-500' },
  { name: 'Chat', href: '/chat', icon: MessageCircle, color: 'from-green-500 to-emerald-500' },
  { name: 'Playground', href: '/playground', icon: Code, color: 'from-orange-500 to-red-500' },
  { name: 'Games', href: '/games', icon: Gamepad2, color: 'from-indigo-500 to-purple-500' },
  { name: 'Profile', href: '/profile', icon: User, color: 'from-teal-500 to-cyan-500' },
  { name: 'Settings', href: '/settings', icon: Settings, color: 'from-gray-500 to-slate-500' },
];

const ModernLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationListOpen, setNotificationListOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Floating Navigation Bar */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 sm:px-6">
        <motion.nav
          className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl px-4 sm:px-6 py-3 w-full max-w-6xl"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
        <div className="flex items-center justify-between">
          {/* Left Section - Logo */}
          <motion.div
            className="flex items-center space-x-2 flex-shrink-0"
            whileHover={{ scale: 1.05 }}
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
            >
              <BookOpen className="h-7 w-7 text-primary" />
            </motion.div>
            <span className="text-lg font-bold font-display text-foreground">
              Lurn
            </span>
          </motion.div>

          {/* Center Section - Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
            {navigation.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className="relative group"
                >
                  <motion.div
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </motion.div>

                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl -z-10"
                      layoutId="activeTab"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Search */}
            <motion.div
              className="relative hidden md:block"
              animate={{ scale: searchFocused ? 1.02 : 1 }}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-muted/30 border border-border/50 rounded-xl pl-10 pr-4 py-2 w-40 xl:w-48 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </motion.div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <div className="relative">
              <motion.button
                className="relative p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotificationListOpen(!notificationListOpen)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
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

            {/* User Menu */}
            <motion.div
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              {user?.avatar ? (
                <img
                  className="h-8 w-8 rounded-full"
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium hidden sm:block text-foreground">
                {user?.firstName}
              </span>
            </motion.div>

            {/* Mobile Menu Toggle */}
            <motion.button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
        </motion.nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              className="absolute top-20 left-4 right-4 bg-card border border-border rounded-2xl p-6 shadow-2xl"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
            >
              <div className="space-y-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href ||
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </NavLink>
                  );
                })}
                <hr className="border-border my-4" />
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign out</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-28 px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div
            className="mt-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Back Button */}
            {needsBackButton() && (
              <motion.button
                onClick={() => navigate(getBackPath())}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors group"
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="h-4 w-4 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium">{getBackButtonText()}</span>
              </motion.button>
            )}
            <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-[4rem] right-6 space-y-3 z-40">
        {/* Quick Actions */}
        <motion.div
          className="flex flex-col space-y-2"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <NavLink
            to="/chat"
            className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MessageCircle className="h-6 w-6" />
            </motion.div>
          </NavLink>
          
          <NavLink
            to="/playground"
            className="p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Code className="h-6 w-6" />
            </motion.div>
          </NavLink>
        </motion.div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse animation-delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-float" />
      </div>
    </div>
  );
};

export default ModernLayout;