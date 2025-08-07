import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Zap, Command, Menu } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import NotificationList from '../ui/NotificationList';
import { useNotifications } from '../../contexts/NotificationContext';

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarCollapsed, onToggleSidebar }) => {
  const location = useLocation();
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationListOpen, setNotificationListOpen] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
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
    if (path === '/profile') return 'Profile';
    if (path === '/settings') return 'Settings';
    return 'Lurn';
  };

  const getPageIcon = () => {
    const path = location.pathname;
    if (path === '/playground') return <Command className="h-6 w-6" />;
    if (path === '/chat' || path.startsWith('/chat/')) return <Zap className="h-6 w-6" />;
    return null;
  };

  return (
    <motion.header 
      className="bg-card/20 backdrop-blur-2xl border-b border-border/30 px-6 py-4 relative mb-0 rounded-t-2xl shadow-lg"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-semantic/8 via-transparent to-accent-semantic/8 pointer-events-none rounded-t-2xl" />
      
      {/* Floating orb effects */}
      <div className="absolute top-2 right-8 w-12 h-12 bg-primary-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-2 left-8 w-8 h-8 bg-accent-500/10 rounded-full blur-lg animate-pulse animation-delay-1000" />
      
      <div className="flex items-center justify-between relative z-10">
        <motion.div 
          className="flex items-center space-x-4"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {/* Mobile sidebar toggle */}
          <motion.button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-accent-semantic/20 transition-colors duration-200 lg:hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </motion.button>

          {getPageIcon() && (
            <motion.div 
              className="text-primary-semantic"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              {getPageIcon()}
            </motion.div>
          )}
          <h1 className="text-2xl font-bold font-display text-foreground">
            {getPageTitle()}
          </h1>
        </motion.div>

        <motion.div 
          className="flex items-center space-x-4"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {/* Enhanced Search with glassmorphism */}
          <motion.div 
            className="relative"
            animate={{ 
              scale: searchFocused ? 1.02 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-4 w-4 transition-colors duration-200 ${
                searchFocused ? 'text-primary-500' : 'text-muted-foreground'
              }`} />
            </div>
            <input
              type="text"
              placeholder="Search anything..."
              className={`bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl pl-10 pr-16 py-2.5 w-64 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all duration-300 ${
                searchFocused ? 'shadow-glow-sm bg-card/50' : ''
              }`}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            
            {/* Search shortcut hint */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-robotic text-muted-foreground bg-muted/50 backdrop-blur-sm rounded border border-border/50">
                ⌘K
              </kbd>
            </div>
          </motion.div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Enhanced Notifications with glassmorphism */}
          <div className="relative">
            <motion.button 
              ref={notificationButtonRef}
              className="relative p-3 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 rounded-xl transition-all duration-200 hover:bg-accent-semantic/20 backdrop-blur-sm border border-border/30 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setNotificationListOpen(!notificationListOpen)}
            >
              <Bell className="h-5 w-5" />
              
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span 
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-error-500 to-error-600 text-xs font-bold text-white shadow-glow-sm border-2 border-card"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
              
              {/* Pulse effect for notifications */}
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-error-500 animate-ping opacity-20" />
              )}
            </motion.button>

            {/* Notification List */}
            <NotificationList
              isOpen={notificationListOpen}
              onClose={() => setNotificationListOpen(false)}
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClearAll={clearAll}
              triggerRef={notificationButtonRef}
            />
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;