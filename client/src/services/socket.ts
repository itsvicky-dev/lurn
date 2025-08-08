import { io, Socket } from 'socket.io-client';
import { type ChatMessage } from '../types';
import { handleSocketError, isSocketConnectionError } from '../utils/socketErrorHandler';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      handleSocketError(error);
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      if (isSocketConnectionError(error)) {
        handleSocketError(error);
      } else {
        console.error('Socket error:', error);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to server after', attemptNumber, 'attempts');
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      handleSocketError(error);
    });

    this.socket.on('reconnect_failed', () => {
      console.warn('Failed to reconnect to server after maximum attempts');
      this.isConnected = false;
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Chat methods
  joinChatSession(sessionId: string): void {
    this.socket?.emit('join_chat_session', sessionId);
  }

  leaveChatSession(sessionId: string): void {
    this.socket?.emit('leave_chat_session', sessionId);
  }

  sendMessage(sessionId: string, content: string): void {
    this.socket?.emit('send_message', { sessionId, content });
  }

  onNewMessage(callback: (data: { sessionId: string; message: ChatMessage }) => void): void {
    this.socket?.on('new_message', callback);
  }

  onAITyping(callback: (data: { sessionId?: string; isTyping: boolean }) => void): void {
    this.socket?.on('ai_typing', callback);
  }

  onUserTyping(callback: (data: { userId: string; userName: string; isTyping: boolean }) => void): void {
    this.socket?.on('user_typing', callback);
  }

  emitTyping(sessionId: string, isTyping: boolean): void {
    this.socket?.emit('typing', { sessionId, isTyping });
  }

  // Quick AI question
  askQuickQuestion(question: string, context?: { type: string; id: string }): void {
    this.socket?.emit('quick_question', { question, context });
  }

  onQuickAnswer(callback: (data: { question: string; answer: string; metadata: any }) => void): void {
    this.socket?.on('quick_answer', callback);
  }

  // Progress updates
  updateProgress(type: string, id: string, progress: any): void {
    this.socket?.emit('update_progress', { type, id, progress });
  }

  onProgressUpdated(callback: (data: { type: string; id: string; progress: any; timestamp: string }) => void): void {
    this.socket?.on('progress_updated', callback);
  }

  // Event listeners management
  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  // Connection status
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Generic event emitter
  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  // Generic event listener
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }
}

export const socketService = new SocketService();
export default socketService;