import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ChatSession from '../models/ChatSession.js';
import aiService from '../services/aiService.js';
import Topic from '../models/Topic.js';
import Module from '../models/Module.js';
import LearningPath from '../models/LearningPath.js';

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

export const setupSocketHandlers = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.firstName} ${socket.user.lastName} connected`);

    // Join user to their personal room
    socket.join(`user_${socket.user._id}`);

    // Handle joining a chat session room
    socket.on('join_chat_session', async (sessionId) => {
      try {
        const session = await ChatSession.findOne({
          _id: sessionId,
          userId: socket.user._id
        });

        if (session) {
          socket.join(`chat_${sessionId}`);
          socket.emit('joined_chat_session', { sessionId });
        } else {
          socket.emit('error', { message: 'Chat session not found' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Error joining chat session' });
      }
    });

    // Handle leaving a chat session room
    socket.on('leave_chat_session', (sessionId) => {
      socket.leave(`chat_${sessionId}`);
      socket.emit('left_chat_session', { sessionId });
    });

    // Handle sending a message
    socket.on('send_message', async (data) => {
      try {
        const { sessionId, content } = data;

        if (!content || !sessionId) {
          socket.emit('error', { message: 'Session ID and content are required' });
          return;
        }

        const session = await ChatSession.findOne({
          _id: sessionId,
          userId: socket.user._id
        });

        if (!session) {
          socket.emit('error', { message: 'Chat session not found' });
          return;
        }

        // Add user message
        const userMessage = {
          role: 'user',
          content,
          timestamp: new Date()
        };

        await session.addMessage(userMessage);

        // Emit user message to the chat room
        io.to(`chat_${sessionId}`).emit('new_message', {
          sessionId,
          message: userMessage
        });

        // Indicate that AI is typing
        socket.emit('ai_typing', { sessionId, isTyping: true });

        try {
          // Prepare conversation history for AI
          const conversationMessages = session.messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
          }));

          // Get context data if available
          let contextData = null;
          if (session.contextId && session.contextModel) {
            const ContextModel = session.contextModel === 'Topic' ? Topic : 
                                session.contextModel === 'Module' ? Module : LearningPath;
            contextData = await ContextModel.findById(session.contextId);
          }

          // Generate AI response
          const startTime = Date.now();
          const response = await aiService.generateChatResponse(
            conversationMessages,
            socket.user.preferences,
            contextData ? {
              type: session.contextType,
              title: contextData.title,
              description: contextData.description
            } : null
          );

          // Add AI response
          const aiMessage = {
            role: 'assistant',
            content: response.content,
            timestamp: new Date(),
            metadata: {
              model: response.model,
              tokens: response.usage?.total_tokens,
              responseTime: Date.now() - startTime
            }
          };

          await session.addMessage(aiMessage);

          // Stop typing indicator
          socket.emit('ai_typing', { sessionId, isTyping: false });

          // Emit AI response to the chat room
          io.to(`chat_${sessionId}`).emit('new_message', {
            sessionId,
            message: aiMessage
          });

        } catch (aiError) {
          console.error('AI response error:', aiError);
          socket.emit('ai_typing', { sessionId, isTyping: false });
          socket.emit('error', { 
            message: 'Failed to generate AI response',
            sessionId 
          });
        }

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { sessionId, isTyping } = data;
      socket.to(`chat_${sessionId}`).emit('user_typing', {
        userId: socket.user._id,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        isTyping
      });
    });

    // Handle quick AI questions (without creating a session)
    socket.on('quick_question', async (data) => {
      try {
        const { question, context } = data;

        if (!question) {
          socket.emit('error', { message: 'Question is required' });
          return;
        }

        socket.emit('ai_typing', { isTyping: true });

        let contextData = null;
        if (context && context.type && context.id) {
          switch (context.type) {
            case 'topic':
              contextData = await Topic.findById(context.id);
              break;
            case 'module':
              contextData = await Module.findById(context.id);
              break;
            case 'learning_path':
              contextData = await LearningPath.findById(context.id);
              break;
          }
        }

        const messages = [{ role: 'user', content: question }];

        const response = await aiService.generateChatResponse(
          messages,
          socket.user.preferences,
          contextData ? {
            type: context.type,
            title: contextData.title,
            description: contextData.description
          } : null
        );

        socket.emit('ai_typing', { isTyping: false });
        socket.emit('quick_answer', {
          question,
          answer: response.content,
          metadata: {
            model: response.model,
            usage: response.usage
          }
        });

      } catch (error) {
        console.error('Quick question error:', error);
        socket.emit('ai_typing', { isTyping: false });
        socket.emit('error', { message: 'Error processing quick question' });
      }
    });

    // Handle progress updates
    socket.on('update_progress', async (data) => {
      try {
        const { type, id, progress } = data;
        
        // Emit progress update to user's room
        socket.to(`user_${socket.user._id}`).emit('progress_updated', {
          type,
          id,
          progress,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Progress update error:', error);
        socket.emit('error', { message: 'Error updating progress' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.firstName} ${socket.user.lastName} disconnected`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Handle connection errors
  io.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });
};