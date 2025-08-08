import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  OnboardingRequest,
  LearningPath,
  Module,
  Topic,
  ChatSession,
  QuizResult,
  UserStats,
  ChatStats,
  Suggestion,
  SuggestionFormData,
  SuggestionsResponse
} from '../types/index';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      timeout: 30000,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          // Only redirect to login if not already on login or register page
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
            window.location.href = '/login';
          }
        }
        
        // Handle network errors and server errors with retry for specific endpoints
        if ((error.code === 'ERR_NETWORK' || error.response?.status >= 500) && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Only retry for learning path creation and other critical operations
          if (originalRequest.url?.includes('/learning/paths') && originalRequest.method === 'post') {
            console.log('Network error detected for learning path creation, retrying in 3 seconds...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            try {
              return this.api(originalRequest);
            } catch (retryError: any) {
              console.error('Retry also failed:', retryError);
              // Don't retry again, let the original error propagate
            }
          }
          
          // Retry for onboarding as well
          if (originalRequest.url?.includes('/user/onboarding') && originalRequest.method === 'post') {
            console.log('Network error detected for onboarding, retrying in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            try {
              return this.api(originalRequest);
            } catch (retryError: any) {
              console.error('Onboarding retry also failed:', retryError);
            }
          }
          
          // Retry for leaderboard requests on server errors
          if (originalRequest.url?.includes('/games/leaderboard') && originalRequest.method === 'get') {
            console.log('Server error detected for leaderboard, retrying in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            try {
              return this.api(originalRequest);
            } catch (retryError: any) {
              console.error('Leaderboard retry also failed:', retryError);
            }
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<{ token: string; user: User }> {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<{ token: string; user: User }> {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async refreshToken(): Promise<{ token: string }> {
    const response = await this.api.post('/auth/refresh');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
  }

  // User endpoints
  async completeOnboarding(data: OnboardingRequest): Promise<{ user: User; learningPaths: LearningPath[] }> {
    const response = await this.api.post('/user/onboarding', data, {
      timeout: 120000 // 2 minutes timeout for onboarding
    });
    return response.data;
  }

  async updatePreferences(preferences: Partial<OnboardingRequest>): Promise<{ preferences: any }> {
    const response = await this.api.put('/user/preferences', preferences);
    return response.data;
  }

  async getUserProfile(): Promise<{ user: User }> {
    const response = await this.api.get('/user/profile');
    return response.data;
  }

  async updateProfile(data: { firstName?: string; lastName?: string; avatar?: string }): Promise<{ user: User }> {
    const response = await this.api.put('/user/profile', data);
    return response.data;
  }

  async getUserStats(): Promise<{ stats: UserStats }> {
    const response = await this.api.get('/user/stats');
    return response.data;
  }

  // Learning endpoints
  async getLearningPaths(): Promise<{ learningPaths: LearningPath[] }> {
    const response = await this.api.get('/learning/paths');
    return response.data;
  }

  async getLearningPath(pathId: string): Promise<{ learningPath: LearningPath }> {
    const response = await this.api.get(`/learning/paths/${pathId}`);
    return response.data;
  }

  async createLearningPath(data: { subject: string; preferences?: any }): Promise<{ learningPath: LearningPath }> {
    console.log('🚀 Starting learning path creation request:', data);
    
    try {
      // Use longer timeout for learning path creation as AI generation can take time
      const response = await this.api.post('/learning/paths', data, {
        timeout: 660000, // 11 minutes timeout for learning path creation (longer than backend)
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Learning path creation response received:', {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data || {}),
        hasLearningPath: !!response.data?.learningPath
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Learning path creation failed:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout
        }
      });
      
      // If it's a network error, provide more context
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('🔍 Network error details:', {
          baseURL: this.api.defaults.baseURL,
          fullURL: `${this.api.defaults.baseURL}/learning/paths`,
          requestData: data
        });
      }
      
      throw error;
    }
  }

  async generateModules(pathId: string): Promise<{ learningPath: LearningPath }> {
    // Use longer timeout for module generation as AI generation can take time
    const response = await this.api.post(`/learning/paths/${pathId}/generate-modules`, {}, {
      timeout: 180000 // 3 minutes timeout for module generation
    });
    return response.data;
  }

  async generateTopicContent(moduleId: string): Promise<{ module: Module }> {
    // Use longer timeout for topic content generation as AI generation can take time
    const response = await this.api.post(`/learning/modules/${moduleId}/generate-topics`, {}, {
      timeout: 180000 // 3 minutes timeout for topic generation
    });
    return response.data;
  }

  async getModule(moduleId: string, signal?: AbortSignal): Promise<{ module: Module }> {
    const response = await this.api.get(`/learning/modules/${moduleId}`, {
      signal
    });
    return response.data;
  }

  async getTopic(topicId: string, signal?: AbortSignal): Promise<{ topic: Topic }> {
    const response = await this.api.get(`/learning/topics/${topicId}`, {
      signal,
      timeout: 180000 // 3 minutes timeout for topic loading (includes AI content generation)
    });
    return response.data;
  }

  async completeTopic(topicId: string, data: { timeSpent?: number; notes?: string }): Promise<any> {
    const response = await this.api.post(`/learning/topics/${topicId}/complete`, data);
    return response.data;
  }

  async retryTopicGeneration(topicId: string): Promise<{ topic: Topic; message: string }> {
    const response = await this.api.post(`/learning/topics/${topicId}/retry-generation`, {}, {
      timeout: 180000 // 3 minutes timeout for content regeneration
    });
    return response.data;
  }

  async submitQuiz(topicId: string, answers: string[]): Promise<QuizResult> {
    const response = await this.api.post(`/learning/topics/${topicId}/quiz`, { answers });
    return response.data;
  }

  async generateAdditionalModules(pathId: string, count: number = 5): Promise<{ modulesAdded: number; totalModules: number; generationTime: number }> {
    const response = await this.api.post(`/learning/paths/${pathId}/modules/generate`, { count }, {
      timeout: 180000 // 3 minutes timeout for module generation
    });
    return response.data;
  }

  async generateAdditionalTopics(moduleId: string, count: number = 5): Promise<{ topicsAdded: number; totalTopics: number; generationTime: number }> {
    const response = await this.api.post(`/learning/modules/${moduleId}/topics/generate`, { count }, {
      timeout: 120000 // 2 minutes timeout for topic generation
    });
    return response.data;
  }

  // AI endpoints
  async generateVisualAids(topicId: string): Promise<{ visualAids: any[]; message: string }> {
    const response = await this.api.post(`/ai/visual-aids/${topicId}`, {}, {
      timeout: 120000 // 2 minutes timeout for visual aids generation
    });
    return response.data;
  }

  async regenerateContent(topicId: string, preferences?: any): Promise<{ topic: Topic }> {
    const response = await this.api.post(`/ai/regenerate-content/${topicId}`, { preferences }, {
      timeout: 180000 // 3 minutes timeout for content regeneration
    });
    return response.data;
  }

  async generateLearningPath(subject: string, customPreferences?: any): Promise<{ pathData: any }> {
    const response = await this.api.post('/ai/generate-path', { subject, customPreferences }, {
      timeout: 300000 // 5 minutes timeout for learning path generation
    });
    return response.data;
  }

  async askAI(question: string, context?: { type: string; id: string }): Promise<{ response: string; metadata: any }> {
    const response = await this.api.post('/ai/ask', { question, context }, {
      timeout: 120000 // 2 minutes timeout for AI questions
    });
    return response.data;
  }

  async explainCode(code: string, language?: string, context?: string): Promise<{ explanation: string; metadata: any }> {
    const response = await this.api.post('/ai/explain-code', { code, language, context }, {
      timeout: 180000 // 3 minutes timeout for code explanation
    });
    return response.data;
  }

  async generatePracticeExercises(topicId: string, difficulty?: string, count?: number): Promise<{ exercises: any[] }> {
    const response = await this.api.post(`/ai/practice-exercises/${topicId}`, { difficulty, count }, {
      timeout: 180000 // 3 minutes timeout for practice exercises generation
    });
    return response.data;
  }

  async generateCodeSuggestions(code: string, language: string, issue: string): Promise<{ suggestions: string; metadata: any }> {
    const response = await this.api.post('/ai/code-suggestions', { code, language, issue }, {
      timeout: 180000 // 3 minutes timeout for code suggestions
    });
    return response.data;
  }

  async generateCodeReview(code: string, language: string): Promise<{ review: string; metadata: any }> {
    const response = await this.api.post('/ai/code-review', { code, language }, {
      timeout: 180000 // 3 minutes timeout for code review
    });
    return response.data;
  }

  async generateCodingExercises(topic: string, difficulty?: string, count?: number, language?: string): Promise<{ exercises: any[] }> {
    const response = await this.api.post('/ai/coding-exercises', { topic, difficulty, count, language }, {
      timeout: 180000 // 3 minutes timeout for coding exercises generation
    });
    return response.data;
  }

  // Chat endpoints
  async getChatSessions(): Promise<{ sessions: ChatSession[] }> {
    const response = await this.api.get('/chat/sessions');
    return response.data;
  }

  async getChatSession(sessionId: string): Promise<{ session: ChatSession }> {
    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      throw new Error('Invalid session ID provided');
    }
    const response = await this.api.get(`/chat/sessions/${sessionId}`);
    return response.data;
  }

  async createChatSession(data: {
    title: string;
    contextType?: string;
    contextId?: string;
    initialMessage?: string;
  }): Promise<{ session: ChatSession }> {
    const response = await this.api.post('/chat/sessions', data);
    return response.data;
  }

  async sendMessage(sessionId: string, content: string): Promise<{ response: any }> {
    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      throw new Error('Invalid session ID provided for sending message');
    }
    const response = await this.api.post(`/chat/sessions/${sessionId}/messages`, { content }, {
      timeout: 120000 // 2 minutes timeout for chat messages
    });
    return response.data;
  }

  async updateChatSession(sessionId: string, data: { title?: string; isActive?: boolean }): Promise<{ session: ChatSession }> {
    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      throw new Error('Invalid session ID provided for update');
    }
    const response = await this.api.put(`/chat/sessions/${sessionId}`, data);
    return response.data;
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      throw new Error('Invalid session ID provided for deletion');
    }
    await this.api.delete(`/chat/sessions/${sessionId}`);
  }

  async getChatStats(): Promise<{ stats: ChatStats }> {
    const response = await this.api.get('/chat/stats');
    return response.data;
  }

  // Code execution endpoints
  async executeCode(data: { language: string; code: string }): Promise<{ output?: string; error?: string }> {
    const response = await this.api.post('/code/execute', data);
    return response.data;
  }

  async getSupportedLanguages(): Promise<{ languages: any[] }> {
    const response = await this.api.get('/code/languages');
    return response.data;
  }

  async getCodeTemplate(language: string, type: string = 'hello'): Promise<{ template: string; availableTemplates: string[]; language: string; type: string }> {
    const response = await this.api.get(`/code/template/${language}?type=${type}`);
    return response.data;
  }

  async getAvailableTemplates(language: string): Promise<{ language: string; templates: string[] }> {
    const response = await this.api.get(`/code/templates/${language}`);
    return response.data;
  }

  async getSystemStatus(): Promise<{ dockerAvailable: boolean; systemInfo: any; fallbackAvailable: boolean }> {
    const response = await this.api.get('/code/system/status');
    return response.data;
  }

  async pullDockerImages(): Promise<{ message: string }> {
    const response = await this.api.post('/code/system/pull-images');
    return response.data;
  }

  // Gaming endpoints
  async getCodingGames(filters?: any): Promise<{ games: any[] }> {
    const params = filters ? new URLSearchParams(filters).toString() : '';
    const response = await this.api.get(`/games/coding${params ? `?${params}` : ''}`);
    return response.data;
  }

  async getCodingGame(gameId: string): Promise<{ game: any }> {
    const response = await this.api.get(`/games/coding/${gameId}`);
    return response.data;
  }

  async getGameProgress(): Promise<{ progress: any }> {
    const response = await this.api.get('/games/progress');
    return response.data;
  }

  async initGameProgress(): Promise<{ progress: any; message: string }> {
    const response = await this.api.post('/games/init-progress');
    return response.data;
  }

  async getGameLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'weekly'): Promise<{ leaderboard: any }> {
    try {
      const response = await this.api.get(`/games/leaderboard?period=${period}`, {
        timeout: 10000 // 10 seconds timeout for leaderboard
      });
      return response.data;
    } catch (error: any) {
      console.error('Leaderboard API Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        period: period,
        url: `/games/leaderboard?period=${period}`
      });
      
      // If it's a server error (5xx), provide more context
      if (error.response?.status >= 500) {
        console.error('Server error detected for leaderboard. This might be a backend issue.');
      }
      
      throw error;
    }
  }

  async startCodingGame(gameId: string): Promise<{ session: any }> {
    const response = await this.api.post(`/games/coding/${gameId}/start`);
    return response.data;
  }

  async submitGameSolution(sessionId: string, code: string, quizResults?: any): Promise<{ session: any }> {
    const payload: any = { code };
    if (quizResults) {
      payload.quizResults = quizResults;
    }
    const response = await this.api.post(`/games/sessions/${sessionId}/submit`, payload);
    return response.data;
  }

  async useGameHint(sessionId: string, hintIndex: number): Promise<{ session: any }> {
    const response = await this.api.post(`/games/sessions/${sessionId}/hint`, { hintIndex });
    return response.data;
  }

  async abandonGame(sessionId: string): Promise<void> {
    await this.api.post(`/games/sessions/${sessionId}/abandon`);
  }

  async generateGame(gameParams: {
    type: string;
    difficulty: string;
    language: string;
    category?: string;
    topic?: string;
    estimatedTime?: number;
    customRequirements?: string;
  }): Promise<{ game: any }> {
    const response = await this.api.post('/games/generate', gameParams);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; environment: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Suggestion methods
  async submitSuggestion(suggestionData: SuggestionFormData): Promise<{ message: string; suggestion: Suggestion }> {
    const response = await this.api.post('/suggestions', suggestionData);
    return response.data;
  }

  async getMySuggestions(page = 1, limit = 10): Promise<SuggestionsResponse> {
    const response = await this.api.get(`/suggestions/my-suggestions?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getPublicSuggestions(page = 1, limit = 10, category?: string, sortBy?: string): Promise<SuggestionsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (category && category !== 'all') {
      params.append('category', category);
    }
    
    if (sortBy) {
      params.append('sortBy', sortBy);
    }

    const response = await this.api.get(`/suggestions/public?${params.toString()}`);
    return response.data;
  }

  async voteSuggestion(suggestionId: string, voteType: 'upvote' | 'downvote' | 'remove'): Promise<{ message: string; voteCount: any; userVote: string | null }> {
    const response = await this.api.post(`/suggestions/${suggestionId}/vote`, { voteType });
    return response.data;
  }

  async deleteSuggestion(suggestionId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/suggestions/${suggestionId}`);
    return response.data;
  }

  // Admin-only suggestion methods
  async getAllSuggestions(page = 1, limit = 20, status?: string, category?: string, sortBy?: string, sortOrder?: string): Promise<SuggestionsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (status && status !== 'all') {
      params.append('status', status);
    }
    
    if (category && category !== 'all') {
      params.append('category', category);
    }
    
    if (sortBy) {
      params.append('sortBy', sortBy);
    }
    
    if (sortOrder) {
      params.append('sortOrder', sortOrder);
    }

    const response = await this.api.get(`/suggestions/admin/all?${params.toString()}`);
    return response.data;
  }

  async updateSuggestionStatus(suggestionId: string, status: string, adminNotes?: string, priority?: string): Promise<{ message: string; suggestion: Suggestion }> {
    const response = await this.api.patch(`/suggestions/admin/${suggestionId}/status`, {
      status,
      adminNotes,
      priority
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;