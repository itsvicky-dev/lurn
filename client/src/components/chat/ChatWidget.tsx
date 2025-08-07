import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { ChatMessage } from '../../types';
import socketService from '../../services/socket';
import apiService from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  X, 
  Send, 
  MessageCircle, 
  Bot, 
  User,
  Minimize2
} from 'lucide-react';
import { format } from 'date-fns';
import { safeFormatTimestamp } from '../../utils/dateUtils';

interface ChatWidgetProps {
  contextType?: 'topic' | 'module' | 'learning_path' | 'general';
  contextId?: string;
  onClose: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  contextType = 'general',
  contextId,
  onClose
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Create or get existing chat session
    const initializeChat = async () => {
      try {
        const contextTitle = contextType === 'topic' ? 'Topic Discussion' :
                           contextType === 'module' ? 'Module Help' :
                           contextType === 'learning_path' ? 'Learning Path Support' :
                           'General AI Chat';

        const { session } = await apiService.createChatSession({
          title: contextTitle,
          contextType,
          contextId
        });

        setSessionId(session.id);
        setMessages(session.messages || []);

        // Join socket room
        if (socketService.connected) {
          socketService.joinChatSession(session.id);
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    };

    initializeChat();

    // Socket event listeners
    const handleNewMessage = (data: { sessionId: string; message: ChatMessage }) => {
      if (data.sessionId === sessionId) {
        setMessages(prev => [...prev, data.message]);
        setIsLoading(false);
      }
    };

    const handleAITyping = (data: { sessionId?: string; isTyping: boolean }) => {
      if (!data.sessionId || data.sessionId === sessionId) {
        setIsTyping(data.isTyping);
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onAITyping(handleAITyping);

    return () => {
      if (sessionId) {
        socketService.leaveChatSession(sessionId);
      }
      socketService.off('new_message', handleNewMessage);
      socketService.off('ai_typing', handleAITyping);
    };
  }, [contextType, contextId, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      if (socketService.connected) {
        // Send via socket for real-time response
        socketService.sendMessage(sessionId, message);
      } else {
        // Fallback to HTTP API
        const response = await apiService.sendMessage(sessionId, message);
        const aiMessage: ChatMessage = {
          role: 'assistant',
          content: response.response.content,
          timestamp: new Date().toISOString(),
          metadata: response.response.metadata
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (role: string) => {
    return role === 'user' ? (
      <User className="h-4 w-4" />
    ) : (
      <Bot className="h-4 w-4" />
    );
  };

  const getMessageStyle = (role: string) => {
    return role === 'user' 
      ? 'bg-primary-600 text-white ml-auto' 
      : 'bg-gray-100 text-gray-900 mr-auto';
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary-600" />
          <h3 className="font-medium text-gray-900">AI Tutor</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-gray-400 hover:text-gray-500 rounded"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-500 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Context Info */}
      {contextType !== 'general' && (
        <div className="p-3 bg-primary-50 border-b border-primary-100">
          <p className="text-xs text-primary-700">
            💡 I'm here to help with your current {contextType}. Ask me anything!
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">
              Hi! I'm your AI tutor. How can I help you today?
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className="flex items-start space-x-2">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              message.role === 'user' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {getMessageIcon(message.role)}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`inline-block max-w-full p-3 rounded-lg text-sm ${getMessageStyle(message.role)}`}>
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-sm max-w-none"
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            className="text-xs"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-gray-200 px-1 py-0.5 rounded text-xs" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {safeFormatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 input text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-1 mt-2">
          {contextType === 'topic' && (
            <>
              <button
                onClick={() => setInputMessage("Can you explain this topic in simpler terms?")}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
              >
                Explain simply
              </button>
              <button
                onClick={() => setInputMessage("Can you give me more examples?")}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
              >
                More examples
              </button>
              <button
                onClick={() => setInputMessage("What are the key takeaways?")}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
              >
                Key points
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;