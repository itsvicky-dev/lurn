import { notificationService } from './notificationService';
import apiService from './api';
import toast from 'react-hot-toast';

export interface BackgroundTask {
  id: string;
  type: 'learning-path' | 'modules' | 'topics' | 'course' | 'onboarding-path';
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  endTime?: number;
  error?: string;
  result?: any;
  source?: 'onboarding' | 'manual' | 'enhanced';
}

class BackgroundTaskService {
  private tasks: Map<string, BackgroundTask> = new Map();
  private listeners: Set<(tasks: BackgroundTask[]) => void> = new Set();
  private pollIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Request notification permission on initialization
    this.initializeNotifications();
  }

  private async initializeNotifications() {
    try {
      await notificationService.requestPermission();
    } catch (error) {
      console.warn('Failed to initialize notifications:', error);
    }
  }

  addListener(callback: (tasks: BackgroundTask[]) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    const tasks = Array.from(this.tasks.values());
    this.listeners.forEach(callback => callback(tasks));
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async createLearningPathInBackground(subject: string, preferences?: any, source: 'onboarding' | 'manual' | 'enhanced' = 'manual'): Promise<string> {
    const taskId = this.generateTaskId();
    const task: BackgroundTask = {
      id: taskId,
      type: source === 'onboarding' ? 'onboarding-path' : 'learning-path',
      title: subject,
      status: 'in-progress',
      progress: 0,
      startTime: Date.now(),
      source: source,
    };

    this.tasks.set(taskId, task);
    this.notifyListeners();

    try {
      // Show initial toast based on source
      const toastMessage = source === 'onboarding' 
        ? `🎯 Queued learning path for "${subject}" from onboarding!`
        : source === 'enhanced'
        ? `🚀 Creating enhanced learning path for "${subject}" in the background!`
        : `🚀 Creating learning path for "${subject}" in the background!`;
      
      toast.success(toastMessage);
      
      // Start progress simulation
      this.simulateProgress(taskId, 120000); // 2 minutes estimated

      // Make the API call
      const result = await apiService.createLearningPath({ subject, preferences });
      
      // Update task as completed
      task.status = 'completed';
      task.progress = 100;
      task.endTime = Date.now();
      task.result = result;
      
      this.tasks.set(taskId, task);
      this.notifyListeners();

      // Clear progress interval
      const interval = this.pollIntervals.get(taskId);
      if (interval) {
        clearInterval(interval);
        this.pollIntervals.delete(taskId);
      }

      // Show success notification
      await notificationService.notifyContentReady('learning-path', subject);
      toast.success(`✅ Learning path "${subject}" is ready!`, { duration: 6000 });

      // Dispatch custom event to refresh learning paths
      window.dispatchEvent(new CustomEvent('learningPathCreated', { 
        detail: { subject, taskId, result } 
      }));

      return taskId;
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      task.endTime = Date.now();
      
      this.tasks.set(taskId, task);
      this.notifyListeners();

      // Clear progress interval
      const interval = this.pollIntervals.get(taskId);
      if (interval) {
        clearInterval(interval);
        this.pollIntervals.delete(taskId);
      }

      toast.error(`❌ Failed to create learning path: ${error.message}`);
      throw error;
    }
  }

  async generateModulesInBackground(pathId: string, pathTitle: string): Promise<string> {
    const taskId = this.generateTaskId();
    const task: BackgroundTask = {
      id: taskId,
      type: 'modules',
      title: pathTitle,
      status: 'in-progress',
      progress: 0,
      startTime: Date.now(),
    };

    this.tasks.set(taskId, task);
    this.notifyListeners();

    try {
      toast.success(`🚀 Generating modules for "${pathTitle}" in the background!`);
      
      this.simulateProgress(taskId, 180000); // 3 minutes estimated

      const result = await apiService.generateModules(pathId);
      
      task.status = 'completed';
      task.progress = 100;
      task.endTime = Date.now();
      task.result = result;
      
      this.tasks.set(taskId, task);
      this.notifyListeners();

      const interval = this.pollIntervals.get(taskId);
      if (interval) {
        clearInterval(interval);
        this.pollIntervals.delete(taskId);
      }

      await notificationService.notifyContentReady('modules', pathTitle);
      toast.success(`✅ Modules for "${pathTitle}" are ready!`, { duration: 6000 });

      // Dispatch custom event to refresh learning paths
      window.dispatchEvent(new CustomEvent('modulesGenerated', { 
        detail: { pathTitle, taskId, result } 
      }));

      return taskId;
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      task.endTime = Date.now();
      
      this.tasks.set(taskId, task);
      this.notifyListeners();

      const interval = this.pollIntervals.get(taskId);
      if (interval) {
        clearInterval(interval);
        this.pollIntervals.delete(taskId);
      }

      toast.error(`❌ Failed to generate modules: ${error.message}`);
      throw error;
    }
  }

  async generateTopicsInBackground(moduleId: string, moduleTitle: string): Promise<string> {
    const taskId = this.generateTaskId();
    const task: BackgroundTask = {
      id: taskId,
      type: 'topics',
      title: moduleTitle,
      status: 'in-progress',
      progress: 0,
      startTime: Date.now(),
    };

    this.tasks.set(taskId, task);
    this.notifyListeners();

    try {
      toast.success(`🚀 Generating topics for "${moduleTitle}" in the background!`);
      
      this.simulateProgress(taskId, 180000); // 3 minutes estimated

      const result = await apiService.generateTopicContent(moduleId);
      
      task.status = 'completed';
      task.progress = 100;
      task.endTime = Date.now();
      task.result = result;
      
      this.tasks.set(taskId, task);
      this.notifyListeners();

      const interval = this.pollIntervals.get(taskId);
      if (interval) {
        clearInterval(interval);
        this.pollIntervals.delete(taskId);
      }

      await notificationService.notifyContentReady('topics', moduleTitle);
      toast.success(`✅ Topics for "${moduleTitle}" are ready!`, { duration: 6000 });

      // Dispatch custom event to refresh learning paths
      window.dispatchEvent(new CustomEvent('topicsGenerated', { 
        detail: { moduleTitle, taskId, result } 
      }));

      return taskId;
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      task.endTime = Date.now();
      
      this.tasks.set(taskId, task);
      this.notifyListeners();

      const interval = this.pollIntervals.get(taskId);
      if (interval) {
        clearInterval(interval);
        this.pollIntervals.delete(taskId);
      }

      toast.error(`❌ Failed to generate topics: ${error.message}`);
      throw error;
    }
  }

  private simulateProgress(taskId: string, estimatedDuration: number) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const updateInterval = 2000; // Update every 2 seconds
    const totalUpdates = estimatedDuration / updateInterval;
    let currentUpdate = 0;

    const interval = setInterval(() => {
      const currentTask = this.tasks.get(taskId);
      if (!currentTask || currentTask.status !== 'in-progress') {
        clearInterval(interval);
        this.pollIntervals.delete(taskId);
        return;
      }

      currentUpdate++;
      // Use a logarithmic progress curve to slow down near the end
      const rawProgress = (currentUpdate / totalUpdates) * 100;
      const adjustedProgress = Math.min(95, rawProgress * (1 - Math.exp(-rawProgress / 30)));
      
      currentTask.progress = Math.round(adjustedProgress);
      this.tasks.set(taskId, currentTask);
      this.notifyListeners();

      // Send progress notification every 30 seconds
      if (currentUpdate % 15 === 0) {
        const progressMessage = this.getProgressMessage(currentTask.type, currentTask.progress);
        notificationService.notifyProgress(progressMessage);
      }
    }, updateInterval);

    this.pollIntervals.set(taskId, interval);
  }

  private getProgressMessage(type: string, progress: number): string {
    const messages = {
      'learning-path': [
        `🧠 Analyzing your preferences... ${progress}%`,
        `🎯 Creating learning objectives... ${progress}%`,
        `📚 Structuring your path... ${progress}%`,
        `✨ Finalizing details... ${progress}%`,
      ],
      'onboarding-path': [
        `🎯 Setting up your personalized path... ${progress}%`,
        `📚 Building curriculum structure... ${progress}%`,
        `🧠 Tailoring content to your level... ${progress}%`,
        `✨ Preparing your learning journey... ${progress}%`,
      ],
      'modules': [
        `🔍 Analyzing course structure... ${progress}%`,
        `📖 Creating modules... ${progress}%`,
        `🎯 Organizing content... ${progress}%`,
        `✨ Polishing modules... ${progress}%`,
      ],
      'topics': [
        `💡 Generating content... ${progress}%`,
        `📝 Creating examples... ${progress}%`,
        `🧠 Adding exercises... ${progress}%`,
        `⚡ Finalizing topics... ${progress}%`,
      ],
    };

    const typeMessages = messages[type as keyof typeof messages] || messages['learning-path'];
    const messageIndex = Math.min(Math.floor(progress / 25), typeMessages.length - 1);
    return typeMessages[messageIndex];
  }

  getTask(taskId: string): BackgroundTask | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values());
  }

  getActiveTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values()).filter(task => 
      task.status === 'in-progress' || task.status === 'pending'
    );
  }

  removeTask(taskId: string) {
    const interval = this.pollIntervals.get(taskId);
    if (interval) {
      clearInterval(interval);
      this.pollIntervals.delete(taskId);
    }
    
    this.tasks.delete(taskId);
    this.notifyListeners();
  }

  clearCompletedTasks() {
    const completedTasks = Array.from(this.tasks.entries())
      .filter(([_, task]) => task.status === 'completed' || task.status === 'failed');
    
    completedTasks.forEach(([taskId, _]) => {
      this.removeTask(taskId);
    });
  }
}

export const backgroundTaskService = new BackgroundTaskService();
export default backgroundTaskService;