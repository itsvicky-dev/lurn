import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LearningProvider } from './contexts/LearningContext';
import { ChatProvider } from './contexts/ChatContext';
import { CodePlaygroundProvider } from './contexts/CodePlaygroundContext';
import { GameProvider } from './contexts/GameContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LayoutProvider } from './contexts/LayoutContext';

// Components
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OnboardingPage from './pages/auth/OnboardingPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import LearningPathsPage from './pages/learning/LearningPathsPage';
import LearningPathDetailPage from './pages/learning/LearningPathDetailPage';
import ModuleDetailPage from './pages/learning/ModuleDetailPage';
import TopicDetailPage from './pages/learning/TopicDetailPage';
import ChatPage from './pages/chat/ChatPage';
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';
import CodePlaygroundPage from './pages/playground/CodePlaygroundPage';
import GamesPage from './pages/games/GamesPage';
import GamePlayPage from './pages/games/GamePlayPage';
import SuggestionsPage from './pages/suggestions/SuggestionsPage';
import AdminSuggestionsPage from './pages/admin/AdminSuggestionsPage';

// Layout
import DynamicLayout from './components/layout/DynamicLayout';
import BackgroundTaskIndicator from './components/ui/BackgroundTaskIndicator';
import ErrorBoundary from './components/ui/ErrorBoundary';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Onboarding route */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireOnboarding={false}>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DynamicLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="learning" element={<LearningPathsPage />} />
        <Route path="learning/paths/:pathId" element={<LearningPathDetailPage />} />
        <Route path="learning/modules/:moduleId" element={<ModuleDetailPage />} />
        <Route path="learning/topics/:topicId" element={<TopicDetailPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:sessionId" element={<ChatPage />} />
        <Route path="playground" element={<CodePlaygroundPage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="games/quiz/:gameId" element={<GamePlayPage />} />
        <Route path="suggestions" element={<SuggestionsPage />} />
        <Route path="admin/suggestions" element={<AdminSuggestionsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Game Play Route (Full Screen) - for coding games */}
      <Route
        path="/games/play/:gameId"
        element={
          <ProtectedRoute>
            <GamePlayPage />
          </ProtectedRoute>
        }
      />


    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <LayoutProvider>
            <AuthProvider>
              <NotificationProvider>
                <LearningProvider>
                  <ChatProvider>
                    <CodePlaygroundProvider>
                      <GameProvider>
                  <div className="min-h-screen bg-background text-foreground transition-colors duration-300 cyber-grid">
                    <AppRoutes />
                    <BackgroundTaskIndicator />
                    <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      className: 'font-robotic',
                      style: {
                        background: 'hsl(var(--card))',
                        color: 'hsl(var(--card-foreground))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 0 20px hsl(var(--primary) / 0.2)',
                        backdropFilter: 'blur(8px)',
                      },
                      success: {
                        duration: 3000,
                        iconTheme: {
                          primary: 'hsl(var(--primary))',
                          secondary: 'hsl(var(--primary-foreground))',
                        },
                        style: {
                          background: 'hsl(var(--card))',
                          color: 'hsl(var(--card-foreground))',
                          border: '1px solid hsl(var(--primary) / 0.3)',
                          boxShadow: '0 0 20px hsl(var(--primary) / 0.2)',
                        },
                      },
                      error: {
                        duration: 5000,
                        iconTheme: {
                          primary: 'hsl(var(--destructive))',
                          secondary: 'hsl(var(--destructive-foreground))',
                        },
                        style: {
                          background: 'hsl(var(--card))',
                          color: 'hsl(var(--card-foreground))',
                          border: '1px solid hsl(var(--destructive) / 0.3)',
                          boxShadow: '0 0 20px hsl(var(--destructive) / 0.2)',
                        },
                      },
                      loading: {
                        iconTheme: {
                          primary: 'hsl(var(--primary))',
                          secondary: 'hsl(var(--primary-foreground))',
                        },
                        style: {
                          background: 'hsl(var(--card))',
                          color: 'hsl(var(--card-foreground))',
                          border: '1px solid hsl(var(--primary) / 0.3)',
                          boxShadow: '0 0 20px hsl(var(--primary) / 0.2)',
                        },
                      },
                    }}
                  />
                  </div>
                      </GameProvider>
                    </CodePlaygroundProvider>
                  </ChatProvider>
                </LearningProvider>
              </NotificationProvider>
            </AuthProvider>
          </LayoutProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;