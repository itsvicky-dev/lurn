import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import EnhancedLoadingSpinner from './EnhancedLoadingSpinner';

interface TimeoutAwareLoaderProps {
  isLoading: boolean;
  message: string;
  onTimeout?: () => void;
  timeoutMs?: number;
  showTimeoutWarning?: boolean;
}

const TimeoutAwareLoader: React.FC<TimeoutAwareLoaderProps> = ({
  isLoading,
  message,
  onTimeout,
  timeoutMs = 30000, // 30 seconds default
  showTimeoutWarning = true
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimeElapsed(0);
      setShowWarning(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1000;
        
        // Show warning at 70% of timeout
        if (showTimeoutWarning && newTime >= timeoutMs * 0.7 && !showWarning) {
          setShowWarning(true);
        }
        
        // Call timeout callback if provided
        if (newTime >= timeoutMs && onTimeout) {
          onTimeout();
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, timeoutMs, onTimeout, showTimeoutWarning, showWarning]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const getProgressColor = () => {
    const progress = timeElapsed / timeoutMs;
    if (progress < 0.5) return 'text-primary';
    if (progress < 0.7) return 'text-warning-500';
    return 'text-error-500';
  };

  const getProgressMessage = () => {
    const progress = timeElapsed / timeoutMs;
    if (progress < 0.3) return 'Processing your request...';
    if (progress < 0.6) return 'This is taking a bit longer than usual...';
    if (progress < 0.8) return 'Almost there, please be patient...';
    return 'This is taking longer than expected...';
  };

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-card border border-border rounded-xl p-6 sm:p-8 max-w-xl w-full shadow-2xl my-4"
        >
          <div className="text-center space-y-4 sm:space-y-6">
            {/* Loading Spinner */}
            <div className="flex justify-center">
              <EnhancedLoadingSpinner type="general" />
            </div>

            {/* Main Message */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                {message}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {getProgressMessage()}
              </p>
            </div>

            {/* Time Elapsed */}
            <div className="flex items-center justify-center space-x-2">
              <Clock className={`h-4 w-4 ${getProgressColor()}`} />
              <span className={`text-xs sm:text-sm font-mono ${getProgressColor()}`}>
                {formatTime(timeElapsed)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((timeElapsed / timeoutMs) * 100, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Warning Message */}
            <AnimatePresence>
              {showWarning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-3 sm:p-4"
                >
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-warning-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-warning-700 dark:text-warning-300 text-left">
                      This operation is taking longer than usual. The process may still complete successfully.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tips */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 Tip: AI content generation can take time</p>
              <p>🔄 The process continues even if the page is refreshed</p>
            </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TimeoutAwareLoader;