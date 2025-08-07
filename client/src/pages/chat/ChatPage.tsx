import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import { useLearning } from '../../contexts/LearningContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  MessageCircle,
  Plus,
  Send,
  Trash2,
  Bot,
  User,
  Code,
  BookOpen,
  Lightbulb,
  Settings,
  MoreVertical
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ChatPage: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTopic, currentModule, currentPath } = useLearning();
  const {
    sessions,
    currentSession,
    loading,
    sendingMessage,
    loadSession,
    createSession,
    sendMessage,
    deleteSession,
    setCurrentSession,
    createContextualSession
  } = useChat();

  const [message, setMessage] = useState('');
  const [showSessionMenu, setShowSessionMenu] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load session if sessionId is provided and valid
  useEffect(() => {
    if (sessionId && sessionId !== 'undefined' && sessionId !== 'null' && sessionId !== currentSession?.id) {
      loadSession(sessionId);
    } else if (!sessionId && currentSession) {
      // If no sessionId in URL but we have a current session, clear it
      setCurrentSession(null);
    }
  }, [sessionId, currentSession?.id, loadSession, setCurrentSession]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendingMessage) return;

    // Check if we have a valid current session
    if (!currentSession || !currentSession.id || currentSession.id === 'undefined' || currentSession.id === 'null') {
      toast.error('No active chat session. Please create a new chat session first.');
      return;
    }

    const messageToSend = message.trim();
    setMessage('');

    try {
      await sendMessage(messageToSend);
    } catch (error) {
      setMessage(messageToSend); // Restore message on error
    }
  };

  const handleCreateNewSession = async () => {
    try {
      const session = await createSession('New Chat Session');
      navigate(`/chat/${session.id}`);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleCreateContextualSession = async () => {
    try {
      const session = await createContextualSession();
      if (session) {
        navigate(`/chat/${session.id}`);
      }
    } catch (error) {
      // Error handled in context
    }
  };

  const handleDeleteSession = async (sessionIdToDelete: string) => {
    // Validate session ID before attempting to delete
    if (!sessionIdToDelete || sessionIdToDelete === 'undefined' || sessionIdToDelete === 'null') {
      console.error('Cannot delete session: Invalid session ID', sessionIdToDelete);
      toast.error('Cannot delete session: Invalid session ID');
      return;
    }

    try {
      await deleteSession(sessionIdToDelete);
      if (sessionIdToDelete === sessionId) {
        navigate('/chat');
      }
      setShowSessionMenu(null);
    } catch (error) {
      // Error handled in context
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContextIcon = (contextType: string) => {
    switch (contextType) {
      case 'topic':
        return <Lightbulb className="h-4 w-4" />;
      case 'module':
        return <BookOpen className="h-4 w-4" />;
      case 'learning_path':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const suggestedPrompts = [
    {
      icon: <Code className="h-5 w-5" />,
      title: "Explain Code",
      description: "Help me understand this code snippet",
      prompt: "Can you explain how this code works and what it does?"
    },
    {
      icon: <Lightbulb className="h-5 w-5" />,
      title: "Concept Help",
      description: "Clarify programming concepts",
      prompt: "I'm having trouble understanding this concept. Can you explain it in simple terms?"
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Debug Help",
      description: "Help fix code issues",
      prompt: "I'm getting an error in my code. Can you help me debug it?"
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "Best Practices",
      description: "Learn coding best practices",
      prompt: "What are the best practices for this programming concept?"
    }
  ];

  if (loading && !currentSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-170px)] bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-card-foreground font-robotic">AI Chat</h1>
            <div className="flex space-x-2">
              {(currentTopic || currentModule || currentPath) && (
                <button
                  onClick={handleCreateContextualSession}
                  className="p-2 text-primary-semantic hover:bg-accent-semantic rounded-lg transition-colors"
                  title="Start contextual chat"
                >
                  <Lightbulb className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={handleCreateNewSession}
                className="p-2 text-primary-semantic hover:bg-accent-semantic rounded-lg transition-colors"
                title="New chat"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Context indicator */}
          {(currentTopic || currentModule || currentPath) && (
            <div className="bg-accent-semantic border border-border rounded-lg p-3">
              <div className="flex items-center space-x-2 text-sm text-accent-foreground font-robotic">
                <BookOpen className="h-4 w-4" />
                <span className="font-medium">Current Context:</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 font-robotic">
                {currentTopic?.title || currentModule?.title || currentPath?.title}
              </p>
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-muted" />
              <p className="text-sm font-robotic">No chat sessions yet</p>
              <p className="text-xs text-muted-foreground mt-1 font-robotic">Start a new conversation</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {sessions.filter(session => session.id && session.id !== 'undefined' && session.id !== 'null').map((session) => (
                <div
                  key={session.id}
                  className={`relative group p-3 rounded-lg cursor-pointer transition-colors ${
                    session.id === currentSession?.id
                      ? 'bg-accent-semantic border border-border'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => {
                    if (session.id && session.id !== 'undefined' && session.id !== 'null') {
                      navigate(`/chat/${session.id}`);
                    } else {
                      console.error('Cannot navigate to session with invalid ID:', session.id);
                      toast.error('Cannot open session: Invalid session ID');
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getContextIcon(session.contextType)}
                        <h3 className="text-sm font-medium text-card-foreground truncate font-robotic">
                          {session.title}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground font-robotic">
                        {session.totalMessages} messages
                      </p>
                      <p className="text-xs text-muted-foreground font-robotic">
                        {new Date(session.lastMessageAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (session.id && session.id !== 'undefined' && session.id !== 'null') {
                            setShowSessionMenu(showSessionMenu === session.id ? null : session.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-card-foreground transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {showSessionMenu === session.id && (
                        <div className="absolute right-0 top-6 bg-card border border-border rounded-lg shadow-lg z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center space-x-3">
                {getContextIcon(currentSession.contextType)}
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">
                    {currentSession.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentSession.contextType === 'general' ? 'General AI Tutor' :
                     `Context: ${currentSession.contextType}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
              {currentSession.messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-card-foreground mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Ask me anything about programming, get code explanations, or request help with your learning.
                  </p>

                  {/* Suggested Prompts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {suggestedPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setMessage(prompt.prompt)}
                        className="p-4 text-left border border-border rounded-lg hover:border-primary-300 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="text-primary-600 dark:text-primary-400">{prompt.icon}</div>
                          <h4 className="font-medium text-card-foreground">{prompt.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{prompt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                currentSession.messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl flex space-x-3 ${
                        msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-muted text-card-foreground'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans">
                            {msg.content}
                          </pre>
                        </div>
                        <div
                          className={`text-xs mt-2 ${
                            msg.role === 'user' ? 'text-primary-200' : 'text-muted-foreground'
                          }`}
                        >
                          {formatTimestamp(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {sendingMessage && (
                <div className="flex justify-start">
                  <div className="max-w-3xl flex space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-muted-foreground">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Ask me anything about programming..."
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[44px] max-h-32 bg-background text-card-foreground"
                    rows={1}
                    disabled={sendingMessage}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!message.trim() || sendingMessage}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* No Session Selected */
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-card-foreground mb-2">
                Welcome to AI Chat
              </h2>
              <p className="text-muted-foreground mb-6">
                Select a chat session or start a new conversation with your AI tutor
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleCreateNewSession}
                  className="btn btn-primary"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Start New Chat
                </button>
                {(currentTopic || currentModule || currentPath) && (
                  <button
                    onClick={handleCreateContextualSession}
                    className="btn btn-secondary block"
                  >
                    <Lightbulb className="h-5 w-5 mr-2" />
                    Get Help with Current Topic
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;