import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationListProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  triggerRef: React.RefObject<HTMLElement> | null;
}

const NotificationList: React.FC<NotificationListProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  triggerRef
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  // Calculate position based on trigger element
  useEffect(() => {
    if (isOpen) {
      if (triggerRef && triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        setPosition({
          top: triggerRect.bottom + 8,
          right: viewportWidth - triggerRect.right
        });
      } else {
        // Fallback position when no trigger ref is provided
        setPosition({
          top: 60,
          right: 20
        });
      }
    }
  }, [isOpen, triggerRef]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        // If there's a trigger ref, check if click was inside it
        if (triggerRef && triggerRef.current && triggerRef.current.contains(event.target as Node)) {
          return; // Don't close if click was on trigger
        }
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-error-500" />;
      default:
        return <Info className="h-5 w-5 text-primary-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-success-500 bg-success-50 dark:bg-success-900/20';
      case 'warning':
        return 'border-l-warning-500 bg-warning-50 dark:bg-warning-900/20';
      case 'error':
        return 'border-l-error-500 bg-error-50 dark:bg-error-900/20';
      default:
        return 'border-l-primary-500 bg-primary-50 dark:bg-primary-900/20';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const notificationContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={listRef}
          className="fixed w-96 max-w-sm bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          style={{ 
            top: position.top,
            right: position.right,
            zIndex: 9999
          }}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-primary-500/10 to-accent-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary-500" />
                <h3 className="font-semibold text-card-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 text-xs font-bold bg-primary-500 text-primary-foreground rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Action buttons */}
            {notifications.length > 0 && (
              <div className="flex items-center space-x-2 mt-3">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-500 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={onClearAll}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We'll notify you when something important happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getTypeColor(notification.type)} ${
                      !notification.read ? 'bg-opacity-100' : 'bg-opacity-50'
                    } hover:bg-opacity-75 transition-all cursor-pointer group`}
                    onClick={() => {
                      if (!notification.read) {
                        onMarkAsRead(notification.id);
                      }
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-card-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.title}
                          </h4>
                          
                          <div className="flex items-center space-x-2 ml-2">
                            {!notification.read && (
                              <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notification.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded transition-all"
                            >
                              <Check className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        
                        <p className={`text-sm mt-1 ${
                          !notification.read ? 'text-card-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center space-x-1 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(notificationContent, document.body);
};

export default NotificationList;