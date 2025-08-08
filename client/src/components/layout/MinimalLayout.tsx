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
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import NotificationList from '../ui/NotificationList';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Learning', href: '/learning', icon: GraduationCap },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Playground', href: '/playground', icon: Code },
  { name: 'Games', href: '/games', icon: Gamepad2 },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const MinimalLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
    <div className="min-h-screen bg-background">
      {/* Clean Top Navigation */}
      <motion.nav
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <BookOpen className="h-8 w-8 text-primary" />
              </motion.div>
              <span className="text-xl font-bold font-display text-foreground">Lurn</span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.slice(0, 5).map((item) => {
                const isActive = location.pathname === item.href ||
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <motion.div
                      className="flex items-center space-x-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </motion.div>

                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                        layoutId="activeIndicator"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <motion.div
                className="relative hidden sm:block"
                animate={{ width: searchFocused ? 280 : 240 }}
                transition={{ duration: 0.2 }}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-muted/30 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </motion.div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <div className="relative">
                <motion.button
                  className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotificationListOpen(!notificationListOpen)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <motion.span
                      className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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
              <div className="relative">
                <motion.button
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  {user?.avatar ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/30 border border-border flex items-center justify-center">
                      <span className="text-foreground font-medium text-sm">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-foreground">
                    {user?.firstName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      
                      <NavLink
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </NavLink>
                      
                      <NavLink
                        to="/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </NavLink>
                      
                      <hr className="border-border my-1" />
                      
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Toggle */}
              <motion.button
                className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden border-t border-border bg-card/95 backdrop-blur-sm"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 py-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href ||
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          className=""
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
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
          <div className="w-12 h-0.5 bg-primary rounded-full" />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Quick Action Button */}
      <motion.div
        className="fixed bottom-[4rem] right-6 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <NavLink
          to="/chat"
          className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MessageCircle className="h-5 w-5" />
          </motion.div>
        </NavLink>
        <NavLink
          to="/playground"
          className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Code className="h-5 w-5" />
          </motion.div>
        </NavLink>
      </motion.div>

      {/* Click outside handlers */}
      {(userMenuOpen || notificationListOpen) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setUserMenuOpen(false);
            setNotificationListOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default MinimalLayout;