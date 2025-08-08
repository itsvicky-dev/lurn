// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isOnboarded: boolean;
  preferences: UserPreferences;
  progress: UserProgress;
  learningPaths: LearningPath[];
  subscription: Subscription;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  subjects: string[];
  learningAge: 'child' | 'teenager' | 'adult' | 'senior';
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tutorPersonality: 'friendly' | 'strict' | 'funny' | 'professional' | 'encouraging';
  learningFormat: ('text' | 'visuals' | 'images' | 'charts' | 'code' | 'videos' | 'audio')[];
  language: string;
}

export interface UserProgress {
  totalModulesCompleted: number;
  totalTimeSpent: number; // in minutes
  streakDays: number;
  lastActiveDate: string;
}

export interface Subscription {
  type: 'free' | 'premium' | 'pro';
  expiresAt?: string;
  features: string[];
}

// Learning types
export interface LearningPath {
  id: string;
  userId: string;
  subject: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: number; // in hours
  modules: Module[];
  prerequisites: string[];
  learningObjectives: string[];
  tags: string[];
  isGenerated: boolean;
  generatedAt: string;
  progress: LearningPathProgress;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface LearningPathProgress {
  completedModules: number;
  totalModules: number;
  percentageComplete: number;
  timeSpent: number; // in minutes
}

export interface Module {
  id: string;
  learningPathId: string;
  title: string;
  description: string;
  order: number;
  estimatedDuration: number; // in minutes
  topics: Topic[];
  prerequisites: ModulePrerequisite[];
  learningObjectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags: string[];
  isContentGenerated: boolean;
  contentGeneratedAt?: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  progress: ModuleProgress;
  createdAt: string;
  updatedAt: string;
}

export interface ModulePrerequisite {
  moduleId: string;
  title: string;
}

export interface ModuleProgress {
  completedTopics: number;
  totalTopics: number;
  percentageComplete: number;
  timeSpent: number; // in minutes
  lastAccessedAt?: string;
}

export interface Topic {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  estimatedDuration: number; // in minutes
  content: TopicContent;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags: string[];
  isContentGenerated: boolean;
  contentGeneratedAt?: string;
  aiGenerationPrompt?: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  userProgress: TopicUserProgress[];
  quiz: Quiz;
  createdAt: string;
  updatedAt: string;
}

export interface TopicContent {
  text: string;
  codeExamples: CodeExample[];
  visualAids: VisualAid[];
  realWorldExamples: RealWorldExample[];
  keyPoints: string[];
  summary: string;
  sections?: any[];
  inlineVisuals?: {
    sections?: any[];
    codeExamples?: any[];
    realWorldExamples?: any[];
  };
}

export interface CodeExample {
  language: string;
  code: string;
  explanation: string;
  isRunnable: boolean;
  visualSuggestion?: string;
}

export interface VisualAid {
  type: 'image' | 'chart' | 'diagram' | 'video';
  url?: string;
  caption?: string;
  description?: string;
}

export interface RealWorldExample {
  title: string;
  description: string;
  explanation: string;
  visualSuggestion?: string;
  code?: string;
  language?: string;
}

export interface TopicUserProgress {
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  timeSpent: number; // in minutes
  completedAt?: string;
  lastAccessedAt?: string;
  notes?: string;
}

export interface Quiz {
  questions: QuizQuestion[];
  passingScore: number;
}

export interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'code';
  options?: string[]; // for multiple choice
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizResult {
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  results: QuizQuestionResult[];
}

export interface QuizQuestionResult {
  questionIndex: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

// Chat types
export interface ChatSession {
  id: string;
  userId: string;
  contextType: 'general' | 'module' | 'topic' | 'learning_path';
  contextId?: string;
  contextModel?: 'Module' | 'Topic' | 'LearningPath';
  title: string;
  messages: ChatMessage[];
  isActive: boolean;
  lastMessageAt: string;
  totalMessages: number;
  tutorPersonality: 'friendly' | 'strict' | 'funny' | 'professional' | 'encouraging';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  model?: string;
  tokens?: number;
  responseTime?: number; // in milliseconds
}

// API types
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface OnboardingRequest {
  subjects: string[];
  learningAge: 'child' | 'teenager' | 'adult' | 'senior';
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tutorPersonality: 'friendly' | 'strict' | 'funny' | 'professional' | 'encouraging';
  learningFormat: ('text' | 'visuals' | 'images' | 'charts' | 'code' | 'videos' | 'audio')[];
  language?: string;
}

// Code playground types
export interface CodePlayground {
  id: string;
  name?: string;
  language: string;
  code: string;
  output?: string;
  error?: string;
  isRunning: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportedLanguage {
  id: string;
  name: string;
  extension: string;
  monacoLanguage: string;
  defaultCode: string;
  runnable: boolean;
}

// Statistics types
export interface UserStats {
  totalLearningPaths: number;
  totalModulesCompleted: number;
  totalTimeSpent: number;
  streakDays: number;
  lastActiveDate: string;
  learningPathsProgress: LearningPathProgress[];
}

export interface ChatStats {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  recentSessions: ChatSession[];
}

// UI types
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: string | number;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: any;
}

// Game types
export interface CodingGame {
  id: string;
  title: string;
  description: string;
  type: 'code_challenge' | 'bug_hunt' | 'code_completion' | 'syntax_puzzle' | 'algorithm_race' | 'quiz';
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  category: string;
  estimatedTime: number; // in minutes
  points: number;
  instructions: string;
  starterCode?: string;
  solution: string;
  testCases: GameTestCase[];
  hints: string[];
  tags: string[];
  prerequisites: string[];
  isUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
  // Quiz-specific fields
  questions?: QuizQuestion[];
  timeLimit?: number; // in seconds for quiz
}

export interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'code';
  options?: string[]; // for multiple choice
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeLimit?: number; // in seconds
}

export interface GameTestCase {
  input: string;
  expectedOutput: string;
  description: string;
  isHidden: boolean;
}

export interface GameSession {
  id: string;
  userId: string;
  gameId: string;
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned';
  code: string;
  score: number;
  timeSpent: number; // in seconds
  hintsUsed: number;
  attempts: number;
  testResults: GameTestResult[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameTestResult {
  testCaseIndex: number;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  executionTime: number;
  error?: string;
}

export interface GameProgress {
  totalGamesPlayed: number;
  totalGamesCompleted: number;
  totalPoints: number;
  averageScore: number;
  streakDays: number;
  favoriteLanguage: string;
  completionRate: number;
  categoryProgress: { [category: string]: GameCategoryProgress };
  achievements: GameAchievement[];
}

export interface GameCategoryProgress {
  category: string;
  totalGames: number;
  completedGames: number;
  totalPoints: number;
  averageScore: number;
}

export interface GameAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'streak' | 'completion' | 'score' | 'speed' | 'language' | 'category';
  requirement: number;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface GameLeaderboard {
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  entries: GameLeaderboardEntry[];
  lastUpdated?: string;
  error?: string;
}

export interface GameLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar?: string;
  score: number;
  gamesCompleted: number;
  averageTime: number;
}

// Suggestion types
export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'bug' | 'content' | 'ui/ux' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'implemented';
  submittedBy: string;
  submitterEmail: string;
  submitterName: string;
  adminNotes?: string;
  votes: {
    upvotes: Array<{
      user: string;
      createdAt: string;
    }>;
    downvotes: Array<{
      user: string;
      createdAt: string;
    }>;
  };
  voteCount?: {
    upvotes: number;
    downvotes: number;
    total: number;
  };
  userVote?: 'upvote' | 'downvote' | null;
  attachments?: Array<{
    filename: string;
    url: string;
    type: string;
  }>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionFormData {
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'bug' | 'content' | 'ui/ux' | 'other';
  tags?: string[];
}

export interface SuggestionStats {
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
  stats?: SuggestionStats;
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}