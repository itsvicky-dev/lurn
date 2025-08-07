import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type LearningPath, type Module, type Topic } from '../types';
import apiService from '../services/api';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import toast from 'react-hot-toast';

interface LearningContextType {
  learningPaths: LearningPath[];
  currentPath: LearningPath | null;
  currentModule: Module | null;
  currentTopic: Topic | null;
  loading: boolean;
  loadingMessage: string;
  loadLearningPaths: () => Promise<void>;
  setCurrentPath: (path: LearningPath | null) => void;
  setCurrentModule: (module: Module | null) => void;
  setCurrentTopic: (topic: Topic | null) => void;
  loadTopic: (topicId: string, signal?: AbortSignal) => Promise<Topic>;
  completeTopic: (topicId: string, timeSpent?: number, notes?: string) => Promise<void>;
  createLearningPath: (subject: string, preferences?: any) => Promise<LearningPath>;
  addLearningPath: (learningPath: LearningPath) => void;
  generateModules: (pathId: string) => Promise<LearningPath>;
  refreshLearningPaths: () => Promise<void>;
  startModule: (moduleId: string) => Promise<void>;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export const useLearning = () => {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};

interface LearningProviderProps {
  children: ReactNode;
}

export const LearningProvider: React.FC<LearningProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [currentPath, setCurrentPath] = useState<LearningPath | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const loadLearningPaths = async () => {
    if (!user?.isOnboarded) return;
    
    try {
      setLoading(true);
      setLoadingMessage('Loading your learning paths...');
      
      // Add a small delay to show the loading animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { learningPaths } = await apiService.getLearningPaths();
      
      // Process learning paths to ensure proper status and progress calculation
      const processedPaths = learningPaths.map(path => {
        const processedPath = { ...path };
        
        // Ensure modules have proper status
        if (processedPath.modules) {
          processedPath.modules = processedPath.modules.map((module, index) => {
            const processedModule = { ...module };
            
            // First module should never be locked if path has modules
            if (index === 0 && processedPath.modules.length > 0) {
              if (processedModule.status === 'locked') {
                processedModule.status = 'available';
              }
            }
            
            // Ensure progress object exists
            if (!processedModule.progress) {
              processedModule.progress = {
                completedTopics: 0,
                totalTopics: processedModule.topics?.length || 0,
                percentageComplete: 0,
                timeSpent: 0
              };
            }
            
            return processedModule;
          });
          
          // Recalculate path progress
          const completedModules = processedPath.modules.filter(m => m.status === 'completed').length;
          const totalModules = processedPath.modules.length;
          
          if (!processedPath.progress) {
            processedPath.progress = {
              completedModules: 0,
              totalModules: totalModules,
              percentageComplete: 0,
              timeSpent: 0
            };
          }
          
          processedPath.progress.completedModules = completedModules;
          processedPath.progress.totalModules = totalModules;
          processedPath.progress.percentageComplete = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
          
          // Update path status based on modules
          if (completedModules === totalModules && totalModules > 0) {
            processedPath.status = 'completed';
          } else if (processedPath.modules.some(m => m.status === 'in_progress' || m.status === 'completed')) {
            processedPath.status = 'in_progress';
          }
        }
        
        return processedPath;
      });
      
      setLearningPaths(processedPaths);
      setLoadingMessage('');
    } catch (error: any) {
      console.error('Failed to load learning paths:', error);
      toast.error('Failed to load learning paths');
      setLoadingMessage('');
    } finally {
      setLoading(false);
    }
  };

  const loadTopic = async (topicId: string, signal?: AbortSignal): Promise<Topic> => {
    try {
      const { topic } = await apiService.getTopic(topicId, signal);
      return topic;
    } catch (error: any) {
      // Don't show error toast for aborted requests
      if (error.name !== 'AbortError' && !signal?.aborted) {
        console.error('Failed to load topic:', error);
        toast.error('Failed to load topic');
      }
      throw error;
    }
  };

  const completeTopic = async (topicId: string, timeSpent?: number, notes?: string) => {
    try {
      const response = await apiService.completeTopic(topicId, { timeSpent, notes });
      
      // Handle notifications from server
      if (response.notifications && Array.isArray(response.notifications)) {
        response.notifications.forEach((notification: any) => {
          addNotification(notification);
        });
      }
      
      // Update local state
      if (currentTopic && currentTopic.id === topicId) {
        const updatedTopic = { ...currentTopic };
        const userProgress = updatedTopic.userProgress.find(p => p.userId === user?.id);
        if (userProgress) {
          userProgress.status = 'completed';
          userProgress.completedAt = new Date().toISOString();
          if (timeSpent) userProgress.timeSpent += timeSpent;
          if (notes) userProgress.notes = notes;
        }
        setCurrentTopic(updatedTopic);
      }
      
      // Update learning paths progress locally
      setLearningPaths(prev => prev.map(path => {
        const updatedPath = { ...path };
        let updated = false;
        
        updatedPath.modules = updatedPath.modules.map(module => {
          const updatedModule = { ...module };
          if (updatedModule.topics.some(topic => topic.id === topicId)) {
            // Update topic status
            updatedModule.topics = updatedModule.topics.map(topic => 
              topic.id === topicId 
                ? { ...topic, status: 'completed' as any }
                : topic
            );
            
            // Recalculate module progress
            const completedTopics = updatedModule.topics.filter(t => t.status === 'completed').length;
            const totalTopics = updatedModule.topics.length;
            updatedModule.progress.completedTopics = completedTopics;
            updatedModule.progress.percentageComplete = Math.round((completedTopics / totalTopics) * 100);
            
            // Update module status
            if (completedTopics === totalTopics) {
              updatedModule.status = 'completed';
            } else if (completedTopics > 0) {
              updatedModule.status = 'in_progress';
            }
            
            updated = true;
          }
          return updatedModule;
        });
        
        if (updated) {
          // Recalculate path progress
          const completedModules = updatedPath.modules.filter(m => m.status === 'completed').length;
          const totalModules = updatedPath.modules.length;
          updatedPath.progress.completedModules = completedModules;
          updatedPath.progress.percentageComplete = Math.round((completedModules / totalModules) * 100);
          
          // Update path status
          if (completedModules === totalModules) {
            updatedPath.status = 'completed';
          } else if (completedModules > 0) {
            updatedPath.status = 'in_progress';
          }
        }
        
        return updatedPath;
      }));
      
      // Also refresh from server to ensure consistency
      setTimeout(() => refreshLearningPaths(), 1000);
      
      // Dispatch custom event to refresh dashboard stats
      window.dispatchEvent(new CustomEvent('userProgressUpdated'));
      
      toast.success('Topic completed!');
    } catch (error: any) {
      console.error('Failed to complete topic:', error);
      toast.error('Failed to complete topic');
      throw error;
    }
  };

  const createLearningPath = async (subject: string, preferences?: any): Promise<LearningPath> => {
    try {
      setLoading(true);
      const { learningPath } = await apiService.createLearningPath({ subject, preferences });
      
      // Add to local state
      setLearningPaths(prev => [learningPath, ...prev]);
      
      toast.success(`Learning path for ${subject} created!`);
      return learningPath;
    } catch (error: any) {
      console.error('Failed to create learning path:', error);
      toast.error('Failed to create learning path');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addLearningPath = (learningPath: LearningPath) => {
    setLearningPaths(prev => [learningPath, ...prev]);
  };

  const generateModules = async (pathId: string): Promise<LearningPath> => {
    try {
      const { learningPath } = await apiService.generateModules(pathId);
      
      // Update local state
      setLearningPaths(prev => 
        prev.map(path => path.id === pathId ? learningPath : path)
      );
      
      return learningPath;
    } catch (error: any) {
      console.error('Failed to generate modules:', error);
      toast.error('Failed to generate modules');
      throw error;
    }
  };

  const refreshLearningPaths = async () => {
    await loadLearningPaths();
  };

  const startModule = async (moduleId: string) => {
    try {
      // Update local state immediately for better UX
      setLearningPaths(prev => prev.map(path => {
        const updatedPath = { ...path };
        let updated = false;
        
        updatedPath.modules = updatedPath.modules.map(module => {
          if (module.id === moduleId) {
            const updatedModule = { ...module, status: 'in_progress' as any };
            updated = true;
            return updatedModule;
          }
          return module;
        });
        
        if (updated) {
          // Update path status if it was not_started
          if (updatedPath.status === 'not_started') {
            updatedPath.status = 'in_progress';
          }
        }
        
        return updatedPath;
      }));
      
      // Update current module if it matches
      if (currentModule && currentModule.id === moduleId) {
        setCurrentModule({ ...currentModule, status: 'in_progress' });
      }
      
      toast.success('Module started!');
    } catch (error: any) {
      console.error('Failed to start module:', error);
      toast.error('Failed to start module');
      throw error;
    }
  };

  // Load learning paths when user is onboarded
  useEffect(() => {
    if (user?.isOnboarded) {
      loadLearningPaths();
    }
  }, [user?.isOnboarded]);

  const value: LearningContextType = {
    learningPaths,
    currentPath,
    currentModule,
    currentTopic,
    loading,
    loadingMessage,
    loadLearningPaths,
    setCurrentPath,
    setCurrentModule,
    setCurrentTopic,
    loadTopic,
    completeTopic,
    createLearningPath,
    addLearningPath,
    generateModules,
    refreshLearningPaths,
    startModule,
  };

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
};