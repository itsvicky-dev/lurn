import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { type ChatSession, type ChatMessage } from '../types';
import apiService from '../services/api';
import { useAuth } from './AuthContext';
import { useLearning } from './LearningContext';
import toast from 'react-hot-toast';

interface ChatContextType {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  loading: boolean;
  sendingMessage: boolean;
  loadSessions: () => Promise<void>;
  createSession: (title: string, contextType?: string, contextId?: string, initialMessage?: string) => Promise<ChatSession>;
  loadSession: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  setCurrentSession: (session: ChatSession | null) => void;
  createContextualSession: () => Promise<ChatSession | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { currentTopic, currentModule, currentPath } = useLearning();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!user?.isOnboarded) return;
    
    try {
      setLoading(true);
      const { sessions } = await apiService.getChatSessions();
      
      // Filter out any sessions with invalid IDs
      const validSessions = sessions.filter(session => {
        if (!session.id || session.id === 'undefined' || session.id === 'null') {
          console.warn('Filtering out session with invalid ID:', session);
          return false;
        }
        return true;
      });
      
      setSessions(validSessions);
    } catch (error: any) {
      console.error('Failed to load chat sessions:', error);
      toast.error('Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  }, [user?.isOnboarded]);

  const createSession = async (
    title: string, 
    contextType: string = 'general', 
    contextId?: string, 
    initialMessage?: string
  ): Promise<ChatSession> => {
    try {
      const { session } = await apiService.createChatSession({
        title,
        contextType,
        contextId,
        initialMessage
      });
      
      // Validate the created session has a valid ID
      if (!session.id || session.id === 'undefined' || session.id === 'null') {
        console.error('Created session has invalid ID:', session);
        throw new Error('Session created with invalid ID');
      }
      
      setSessions(prev => [session, ...prev]);
      setCurrentSession(session);
      
      // Send initial message if provided
      if (initialMessage) {
        await sendMessage(initialMessage);
      }
      
      toast.success('New chat session created');
      return session;
    } catch (error: any) {
      console.error('Failed to create chat session:', error);
      toast.error('Failed to create chat session');
      throw error;
    }
  };

  const loadSession = useCallback(async (sessionId: string) => {
    // Validate sessionId
    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      console.error('Invalid session ID provided:', sessionId);
      toast.error('Invalid session ID');
      return;
    }

    try {
      setLoading(true);
      const { session } = await apiService.getChatSession(sessionId);
      
      // Validate the loaded session has a valid ID
      if (!session.id || session.id === 'undefined' || session.id === 'null') {
        console.error('Loaded session has invalid ID:', session);
        toast.error('Session data is corrupted');
        return;
      }
      
      setCurrentSession(session);
    } catch (error: any) {
      console.error('Failed to load chat session:', error);
      toast.error('Failed to load chat session');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = async (content: string) => {
    if (!currentSession) {
      toast.error('No active chat session');
      return;
    }

    // Validate session ID
    if (!currentSession.id || currentSession.id === 'undefined' || currentSession.id === 'null') {
      console.error('Invalid session ID in current session:', currentSession.id);
      toast.error('Invalid session - please create a new chat');
      return;
    }

    try {
      setSendingMessage(true);
      
      // Add user message to current session immediately for better UX
      const userMessage: ChatMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      };
      
      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, userMessage]
      } : null);

      const { response } = await apiService.sendMessage(currentSession.id, content);
      
      // Add AI response to current session
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        metadata: response.metadata
      };
      
      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, aiMessage],
        lastMessageAt: new Date().toISOString(),
        totalMessages: prev.totalMessages + 2
      } : null);

      // Update sessions list
      setSessions(prev => prev.map(session => 
        session.id === currentSession.id 
          ? { ...session, lastMessageAt: new Date().toISOString(), totalMessages: session.totalMessages + 2 }
          : session
      ));

    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      
      // Remove the user message if sending failed
      setCurrentSession(prev => prev ? {
        ...prev,
        messages: prev.messages.slice(0, -1)
      } : null);
    } finally {
      setSendingMessage(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    // Validate sessionId
    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      console.error('Cannot delete session: Invalid session ID', sessionId);
      toast.error('Cannot delete session: Invalid session ID');
      return;
    }

    try {
      await apiService.deleteChatSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
      
      toast.success('Chat session deleted');
    } catch (error: any) {
      console.error('Failed to delete chat session:', error);
      toast.error('Failed to delete chat session');
    }
  };

  const createContextualSession = async (): Promise<ChatSession | null> => {
    let title = 'AI Tutor Chat';
    let contextType = 'general';
    let contextId: string | undefined;
    let initialMessage: string | undefined;

    // Determine context based on current learning state
    if (currentTopic) {
      title = `Help with: ${currentTopic.title}`;
      contextType = 'topic';
      contextId = currentTopic.id;
      initialMessage = `I'm currently learning about "${currentTopic.title}". Can you help me understand this topic better?`;
    } else if (currentModule) {
      title = `Help with: ${currentModule.title}`;
      contextType = 'module';
      contextId = currentModule.id;
      initialMessage = `I'm working on the "${currentModule.title}" module. Can you provide guidance and answer questions about this module?`;
    } else if (currentPath) {
      title = `Help with: ${currentPath.title}`;
      contextType = 'learning_path';
      contextId = currentPath.id;
      initialMessage = `I'm following the "${currentPath.title}" learning path. Can you help me with questions and provide guidance?`;
    }

    try {
      return await createSession(title, contextType, contextId, initialMessage);
    } catch (error) {
      return null;
    }
  };

  // Load sessions when user is onboarded
  useEffect(() => {
    if (user?.isOnboarded) {
      loadSessions();
    }
  }, [user?.isOnboarded]);

  // Wrapper for setCurrentSession with validation
  const setCurrentSessionSafe = (session: ChatSession | null) => {
    if (session && (!session.id || session.id === 'undefined' || session.id === 'null')) {
      console.error('Attempted to set current session with invalid ID:', session);
      toast.error('Cannot set session: Invalid session ID');
      return;
    }
    setCurrentSession(session);
  };

  const value: ChatContextType = {
    sessions,
    currentSession,
    loading,
    sendingMessage,
    loadSessions,
    createSession,
    loadSession,
    sendMessage,
    deleteSession,
    setCurrentSession: setCurrentSessionSafe,
    createContextualSession,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};