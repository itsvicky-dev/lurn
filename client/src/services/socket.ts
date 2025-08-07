import { io, Socket } from 'socket.io-client';
import { type ChatMessage } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
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