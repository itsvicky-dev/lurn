import React, { useState, useEffect } from 'react';
import { backgroundTaskService, BackgroundTask } from '../../services/backgroundTaskService';
import { X, ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const BackgroundTaskIndicator: React.FC = () => {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = backgroundTaskService.addListener((updatedTasks) => {
      setTasks(updatedTasks);
      setIsVisible(updatedTasks.length > 0);
    });

    // Initialize with current tasks
    setTasks(backgroundTaskService.getAllTasks());
    setIsVisible(backgroundTaskService.getAllTasks().length > 0);

    return () => {
      unsubscribe();
    };
  }, []);

  const activeTasks = tasks.filter(task => task.status === 'in-progress' || task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const failedTasks = tasks.filter(task => task.status === 'failed');

  const handleRemoveTask = (taskId: string) => {
    backgroundTaskService.removeTask(taskId);
  };

  const handleClearCompleted = () => {
    backgroundTaskService.clearCompletedTasks();
  };

  const getTaskIcon = (task: BackgroundTask) => {
    switch (task.status) {
      case 'in-progress':
      case 'pending':
        return <Loader className="h-4 w-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTaskStatusText = (task: BackgroundTask) => {
    switch (task.status) {
      case 'in-progress':
        if (task.type === 'onboarding-path') {
          // Show different messages based on progress for onboarding
          if (task.progress < 20) {
            return 'Setting up your account...';
          } else if (task.progress < 40) {
            return 'AI analyzing your preferences...';
          } else if (task.progress < 70) {
            return 'Generating personalized content...';
          } else if (task.progress < 90) {
            return 'Structuring learning paths...';
          } else {
            return 'Finalizing setup...';
          }
        }
        return `${task.progress}% complete`;
      case 'pending':
        return 'Waiting to start...';
      case 'completed':
        const duration = task.endTime ? Math.round((task.endTime - task.startTime) / 1000) : 0;
        return `Completed in ${duration}s`;
      case 'failed':
        return task.error || 'Failed';
      default:
        return 'Unknown status';
    }
  };

  const getTaskTypeLabel = (type: string) => {
    const labels = {
      'learning-path': '🎯 Learning Path',
      'onboarding-path': '🎓 Onboarding Path',
      'modules': '📚 Modules',
      'topics': '📖 Topics',
      'course': '🎓 Course',
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card rounded-lg shadow-lg border border-border max-w-sm">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent rounded-t-lg"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {activeTasks.length > 0 && (
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              )}
              <span className="font-medium text-card-foreground">
                Background Tasks ({tasks.length})
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {completedTasks.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearCompleted();
                }}
                className="text-xs text-muted-foreground hover:text-card-foreground px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Task List */}
        {isExpanded && (
          <div className="border-t border-border max-h-64 overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="p-3 text-center text-muted-foreground text-sm">
                No background tasks
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-accent"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {getTaskIcon(task)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {getTaskTypeLabel(task.type)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-card-foreground truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getTaskStatusText(task)}
                        </p>
                        {task.status === 'in-progress' && (
                          <div className="w-full bg-muted rounded-full h-1 mt-1">
                            <div
                              className="bg-primary h-1 rounded-full transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="text-muted-foreground hover:text-card-foreground p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary when collapsed */}
        {!isExpanded && (activeTasks.length > 0 || completedTasks.length > 0 || failedTasks.length > 0) && (
          <div className="px-3 pb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {activeTasks.length > 0 && (
                <span className="flex items-center space-x-1">
                  <Loader className="h-3 w-3 animate-spin" />
                  <span>{activeTasks.length} running</span>
                </span>
              )}
              {completedTasks.length > 0 && (
                <span className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>{completedTasks.length} done</span>
                </span>
              )}
              {failedTasks.length > 0 && (
                <span className="flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span>{failedTasks.length} failed</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundTaskIndicator;