import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
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
  Zap,
  ChevronRight,
  Activity,
  Lightbulb,
  Shield
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'text-primary-semantic' },
  { name: 'Learning Paths', href: '/learning', icon: GraduationCap, color: 'text-primary-semantic' },
  { name: 'AI Chat', href: '/chat', icon: MessageCircle, color: 'text-primary-semantic' },
  { name: 'Code Playground', href: '/playground', icon: Code, color: 'text-primary-semantic' },
  { name: 'Coding Games', href: '/games', icon: Gamepad2, color: 'text-primary-semantic' },
  { name: 'Suggestions', href: '/suggestions', icon: Lightbulb, color: 'text-primary-semantic' },
  // { name: 'Profile', href: '/profile', icon: User, color: 'text-primary-semantic' },
  // { name: 'Settings', href: '/settings', icon: Settings, color: 'text-primary-semantic' },
];

// Admin-only navigation items
const adminNavigation = [
  { name: 'Admin - Suggestions', href: '/admin/suggestions', icon: Shield, color: 'text-destructive' },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <motion.div
      className="flex flex-col w-64 bg-card/80 backdrop-blur-xl border-r border-border relative overflow-hidden"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-semantic/5 via-transparent to-accent-semantic/5 pointer-events-none" />

      {/* Logo */}
      <motion.div
        className="flex items-center h-16 px-6 border-b border-border relative z-10 py-10"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2
            }}
          >
            <BookOpen className="h-8 w-8 text-primary-semantic" />
          </motion.div>
          <span className="text-xl font-bold font-display cyber-text text-foreground">
            Lurn
          </span>
        </div>
      </motion.div>

      {/* User info */}
      <motion.div
        className="p-6 border-b border-border relative z-10"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center space-x-3">
          <div className="relative flex-shrink-0">
            {user?.avatar ? (
              <img
                className="h-12 w-12 rounded-full ring-2 ring-primary-500/20"
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/30 border border-border flex items-center justify-center shadow-glow-sm">
                <span className="text-foreground font-bold font-robotic text-lg">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            )}

            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-success-500 rounded-full border-2 border-card shadow-glow-sm">
              <div className="h-full w-full bg-success-400 rounded-full animate-ping opacity-75" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold font-robotic text-foreground truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
            <div className="flex items-center mt-1 space-x-1">
              <Activity className="h-3 w-3 text-success-500" />
              <span className="text-xs text-success-500 font-robotic">Online</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 relative z-10">
        {navigation.map((item, index) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

          return (
            <motion.div
              key={item.name}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 * (index + 3) }}
            >
              <NavLink
                to={item.href}
                className={`group relative flex items-center px-3 py-3 text-sm font-medium font-robotic rounded-xl transition-all duration-300 overflow-hidden ${isActive
                    ? 'bg-gradient-to-r from-primary-semantic/20 to-accent-semantic/20 text-primary-semantic shadow-glow-sm border border-primary-semantic/30 backdrop-blur-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-primary-semantic/5 hover:backdrop-blur-sm'
                  }`}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Background glow effect */}
                <AnimatePresence>
                  {(isActive || hoveredItem === item.name) && (
                    <motion.div
                      className={`absolute inset-0 rounded-xl ${isActive 
                        ? 'bg-gradient-to-r from-primary-semantic/15 to-accent-semantic/15' 
                        : 'bg-gradient-to-r from-primary-semantic/8 to-primary-semantic/8'
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="relative z-10"
                >
                  <item.icon
                    className={`flex-shrink-0 mr-3 h-5 w-5 transition-colors duration-300 ${isActive ? 'text-primary-semantic': 'text-muted-foreground group-hover:text-foreground'
                      }`}
                  />
                </motion.div>

                <span className="truncate relative z-10 tracking-wide">
                  {item.name}
                </span>

                {/* Active indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="ml-auto relative z-10"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <ChevronRight className="h-4 w-4 text-primary-semantic" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover effect */}
                <AnimatePresence>
                  {hoveredItem === item.name && !isActive && (
                    <motion.div
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                    >
                      <Zap className="h-4 w-4 text-primary-semantic" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </NavLink>
            </motion.div>
          );
        })}

        {/* Admin Navigation */}
        {user?.email === 'admin@mail.com' && (
          <>
            <div className="px-3 py-2 mt-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin Panel
              </h3>
            </div>
            {adminNavigation.map((item, index) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

              return (
                <motion.div
                  key={item.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * (navigation.length + index + 3) }}
                >
                  <NavLink
                    to={item.href}
                    className={`group relative flex items-center px-3 py-3 text-sm font-medium font-robotic rounded-xl transition-all duration-300 overflow-hidden ${isActive
                        ? 'bg-gradient-to-r from-destructive/20 to-destructive/10 text-destructive shadow-glow-sm border border-destructive/30 backdrop-blur-sm'
                        : 'text-muted-foreground hover:text-destructive hover:bg-destructive/5 hover:backdrop-blur-sm'
                      }`}
                    onMouseEnter={() => setHoveredItem(item.name)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {/* Background glow effect */}
                    <AnimatePresence>
                      {(isActive || hoveredItem === item.name) && (
                        <motion.div
                          className={`absolute inset-0 rounded-xl ${isActive 
                            ? 'bg-gradient-to-r from-destructive/15 to-destructive/10' 
                            : 'bg-gradient-to-r from-destructive/8 to-destructive/8'
                          }`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </AnimatePresence>

                    <motion.div
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className="relative z-10"
                    >
                      <item.icon
                        className={`flex-shrink-0 mr-3 h-5 w-5 transition-colors duration-300 ${isActive ? 'text-destructive': 'text-muted-foreground group-hover:text-destructive'
                          }`}
                      />
                    </motion.div>

                    <span className="truncate relative z-10 tracking-wide">
                      {item.name}
                    </span>

                    {/* Active indicator */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          className="ml-auto relative z-10"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                        >
                          <ChevronRight className="h-4 w-4 text-destructive" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Hover effect */}
                    <AnimatePresence>
                      {hoveredItem === item.name && !isActive && (
                        <motion.div
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                        >
                          <Shield className="h-4 w-4 text-destructive" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </NavLink>
                </motion.div>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout */}
      <motion.div
        className="p-4 border-t border-border relative z-10"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <motion.button
          onClick={logout}
          className="group relative flex items-center w-full px-3 py-3 text-sm font-medium font-robotic text-muted-foreground rounded-xl hover:text-error-400 hover:bg-error-500/10 transition-all duration-300 overflow-hidden"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="flex-shrink-0 mr-3 h-5 w-5 transition-colors duration-300 group-hover:text-error-400" />
          <span className="truncate tracking-wide">Sign out</span>

          {/* Hover glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-error-500/5 to-error-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default Sidebar;