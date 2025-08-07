import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Module } from '../../types';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EnhancedLoadingSpinner from '../../components/ui/EnhancedLoadingSpinner';
import TopicLoader from '../../components/ui/TopicLoader';
import { backgroundTaskService } from '../../services/backgroundTaskService';
import { notificationService } from '../../services/notificationService';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Play, 
  CheckCircle,
  Lock,
  Bell,
  BellOff,
  Plus,
  Loader2
} from 'lucide-react';
import ChatWidget from '../../components/chat/ChatWidget';
import toast from 'react-hot-toast';

const ModuleDetailPage: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [useBackground, setUseBackground] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingMoreTopics, setLoadingMoreTopics] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    
    const loadModule = async () => {
      if (!moduleId) return;
      
      try {
        setLoading(true);
        const { module } = await apiService.getModule(moduleId, abortController.signal);
        
        // Check if component is still mounted
        if (abortController.signal.aborted) return;
        
        setModule(module);
        setIsInitialized(true);
      } catch (error: any) {
        // Don't show error if request was aborted
        if (error.name === 'AbortError' || abortController.signal.aborted) return;
        
        console.error('Failed to load module:', error);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Only load if we don't already have the module or if moduleId changed
    if (!isInitialized || !module || (module && module.id !== moduleId)) {
      loadModule();
    } else {
      setLoading(false);
    }
    
    // Cleanup function to abort request if component unmounts
    return () => {
      abortController.abort();
    };
  }, [moduleId]); // Remove module from dependencies to prevent loops

  const handleGenerateTopics = async () => {
    if (!moduleId || !module || generatingTopics) return;
    
    // Check if all topics already have content generated
    if (module.topics && module.topics.length > 0 && module.topics.every(t => t.isContentGenerated)) {
      toast.info('All topics already have content generated!');
      return;
    }
    
    if (useBackground) {
      try {
        await backgroundTaskService.generateTopicsInBackground(moduleId, module.title);
        toast.success('🚀 Topic generation started! We\'ll notify you when it\'s ready.');
      } catch (error: any) {
        console.error('Failed to start background task:', error);
        // Fall back to foreground processing
        setUseBackground(false);
        handleForegroundGeneration();
      }
      return;
    }

    handleForegroundGeneration();
  };

  const handleForegroundGeneration = async () => {
    if (!moduleId) return;
    
    try {
      setGeneratingTopics(true);
      
      // Show notification prompt after 15 seconds
      setTimeout(() => {
        if (generatingTopics && !notificationService.isPermissionGranted()) {
          setShowNotificationPrompt(true);
        }
      }, 15000);

      const { module: updatedModule } = await apiService.generateTopicContent(moduleId);
      setModule(updatedModule);
      toast.success('Topic content generated successfully!');
    } catch (error: any) {
      console.error('Failed to generate topic content:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate topic content';
      toast.error(errorMessage);
    } finally {
      setGeneratingTopics(false);
      setShowNotificationPrompt(false);
    }
  };

  const handleNotificationPermissionRequest = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      toast.success('🔔 Notifications enabled! We\'ll let you know when your content is ready.');
      setShowNotificationPrompt(false);
    } else {
      toast.error('Notifications were not enabled. You can still use the app normally.');
    }
  };

  const handleBackgroundToggle = () => {
    setUseBackground(!useBackground);
    if (!useBackground && !notificationService.isPermissionGranted()) {
      notificationService.requestPermission();
    }
  };

  const handleLoadMoreTopics = async () => {
    if (!moduleId || !module || loadingMoreTopics) return;
    
    try {
      setLoadingMoreTopics(true);
      const result = await apiService.generateAdditionalTopics(moduleId, 5);
      
      // Reload the module to get updated data
      const { module: updatedModule } = await apiService.getModule(moduleId);
      setModule(updatedModule);
      
      toast.success(`🎉 Generated ${result.topicsAdded} additional topics! Total: ${result.totalTopics}`);
    } catch (error: any) {
      console.error('Failed to generate additional topics:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate additional topics';
      toast.error(errorMessage);
    } finally {
      setLoadingMoreTopics(false);
    }
  };

  if (loading && !module) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">Module not found</h2>
        <Link to="/learning" className="btn-primary">
          Back to Learning Paths
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{module.title}</h1>
            <p className="text-muted-foreground">{module.description}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Module Progress</h3>
          </div>
          <div className="card-content">
            <div className="progress-bar mb-2">
              <div 
                className="progress-fill"
                style={{ width: `${module.progress.percentageComplete}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {module.progress.completedTopics} of {module.progress.totalTopics} topics completed
            </p>
          </div>
        </div>

        {/* Topics */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title">Topics</h3>
              <div className="flex items-center space-x-3">
                {/* Load More Topics Button */}
                {module.topics && module.topics.length > 0 && !generatingTopics && !loadingMoreTopics && (
                  <button
                    onClick={handleLoadMoreTopics}
                    disabled={loadingMoreTopics}
                    className="btn-secondary btn-sm flex items-center space-x-2"
                    title="Generate more topics for this module"
                  >
                    {loadingMoreTopics ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>{loadingMoreTopics ? 'Generating...' : 'Load More Topics'}</span>
                  </button>
                )}
                
                {/* Generate Content Button */}
                {(!module.topics || module.topics.length === 0 || module.topics.some(t => !t.isContentGenerated)) && !generatingTopics && (
                  <div className="flex items-center space-x-3">
                    {/* Background Processing Toggle */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleBackgroundToggle}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          useBackground ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                        title="Generate in background"
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            useBackground ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      {useBackground ? (
                        <Bell className="h-4 w-4 text-blue-600" />
                      ) : (
                        <BellOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    
                    <button
                      onClick={handleGenerateTopics}
                      disabled={generatingTopics}
                      className="btn-primary btn-sm flex items-center space-x-2"
                    >
                      <Play className="h-4 w-4" />
                      <span>{useBackground ? 'Generate in Background' : 'Generate Topic Content'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            {useBackground && !generatingTopics && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800/30">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  🔔 Topics will be generated in the background. You'll be notified when ready!
                </p>
              </div>
            )}
          </div>
          <div className="card-content">
            {generatingTopics ? (
              <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-lg p-6">
                <EnhancedLoadingSpinner
                  title={`${module.title} Topics`}
                  type='topics'
                  showNotificationPrompt={showNotificationPrompt}
                  onNotificationPermissionRequest={handleNotificationPermissionRequest}
                />
              </div>
            ) : module.topics && module.topics.length > 0 ? (
              <div className="space-y-4">
                {module.topics.map((topic, index) => {
                // For now, make all topics available - the topic detail page can handle missing content
                const isLocked = false; // topic.status === 'locked';
                const isCompleted = topic.status === 'completed';
                
                return (
                  <div
                    key={topic.id || (topic as any)._id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      isLocked ? 'border-border bg-muted/50' : 'border-border hover:border-primary-300'
                    } transition-colors`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        isCompleted ? 'bg-success-100 text-success-600' :
                        isLocked ? 'bg-gray-100 text-gray-400' :
                        'bg-primary-100 text-primary-600'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : isLocked ? (
                          <Lock className="h-5 w-5" />
                        ) : (
                          <span className="font-medium">{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`font-medium ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {topic.title}
                        </h4>
                        <p className={`text-sm ${isLocked ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                          {topic.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{topic.estimatedDuration} min</span>
                          </div>
                          <span className={`badge ${
                            topic.difficulty === 'beginner' ? 'badge-success' :
                            topic.difficulty === 'intermediate' ? 'badge-warning' :
                            topic.difficulty === 'advanced' ? 'badge-error' :
                            'badge-secondary'
                          }`}>
                            {topic.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {isLocked ? (
                        <span className="text-xs text-muted-foreground">Locked</span>
                      ) : (
                        <Link
                          to={`/learning/topics/${topic.id || (topic as any)._id}`}
                          className="btn-primary btn-sm flex items-center space-x-1"
                          onClick={() => console.log('Navigating to topic:', topic.id || (topic as any)._id)}
                        >
                          <Play className="h-3 w-3" />
                          <span>{isCompleted ? 'Review' : 'Start'}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium text-foreground mb-2">No topics available</h4>
                <p className="text-muted-foreground mb-4">
                  This module doesn't have any topics yet. Generate topic content to get started.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Learning Objectives */}
        {module.learningObjectives.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Learning Objectives</h3>
            </div>
            <div className="card-content">
              <ul className="space-y-2">
                {module.learningObjectives.map((objective, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                    <span className="text-foreground">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      {/* Floating AI Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowChat(true)}
          className="bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <span>AI Help</span>
        </button>
      </div>
      {/* Chat Widget */}
      {showChat && (
        <ChatWidget
          contextType="module"
          contextId={module.id || (module as any)._id}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default ModuleDetailPage;