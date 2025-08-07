import express from 'express';
import mongoose from 'mongoose';
import ChatSession from '../models/ChatSession.js';
import { authenticate, requireOnboarding } from '../middleware/auth.js';
import aiService from '../services/aiService.js';
import User from '../models/User.js';
import Topic from '../models/Topic.js';
import Module from '../models/Module.js';
import LearningPath from '../models/LearningPath.js';

const router = express.Router();

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return id && id !== 'undefined' && id !== 'null' && mongoose.Types.ObjectId.isValid(id);
};

// Get all chat sessions for user
router.get('/sessions', authenticate, requireOnboarding, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ 
      userId: req.user._id,
      isActive: true 
    })
    .populate('contextId')
    .sort({ lastMessageAt: -1 })
    .limit(20);

    res.json({ sessions });
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({ message: 'Server error fetching chat sessions' });
  }
});

// Get specific chat session
router.get('/sessions/:sessionId', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Validate sessionId
    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user._id
    }).populate('contextId');

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.json({ session });
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({ message: 'Server error fetching chat session' });
  }
});

// Create new chat session
router.post('/sessions', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { title, contextType, contextId, initialMessage } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const user = await User.findById(req.user._id);

    // Validate context if provided
    let contextModel = null;
    if (contextType && contextId) {
      switch (contextType) {
        case 'topic':
          contextModel = 'Topic';
          const topic = await Topic.findById(contextId);
          if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
          }
          break;
        case 'module':
          contextModel = 'Module';
          const module = await Module.findById(contextId);
          if (!module) {
            return res.status(404).json({ message: 'Module not found' });
          }
          break;
        case 'learning_path':
          contextModel = 'LearningPath';
          const learningPath = await LearningPath.findById(contextId);
          if (!learningPath) {
            return res.status(404).json({ message: 'Learning path not found' });
          }
          break;
      }
    }

    const session = new ChatSession({
      userId: req.user._id,
      title,
      contextType: contextType || 'general',
      contextId: contextId || null,
      contextModel,
      tutorPersonality: user.preferences.tutorPersonality,
      messages: []
    });

    await session.save();

    // Add initial message if provided
    if (initialMessage) {
      await session.addMessage({
        role: 'user',
        content: initialMessage,
        timestamp: new Date()
      });

      // Generate AI response
      try {
        let contextData = null;
        if (contextId && contextModel) {
          const ContextModel = contextModel === 'Topic' ? Topic : 
                              contextModel === 'Module' ? Module : LearningPath;
          contextData = await ContextModel.findById(contextId);
        }

        const response = await aiService.generateChatResponse(
          [{ role: 'user', content: initialMessage }],
          user.preferences,
          contextData ? {
            type: contextType,
            title: contextData.title,
            description: contextData.description
          } : null
        );

        await session.addMessage({
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          metadata: {
            model: response.model,
            tokens: response.usage?.total_tokens,
            responseTime: Date.now() - session.lastMessageAt
          }
        });
      } catch (error) {
        console.error('Error generating initial AI response:', error);
      }
    }

    res.status(201).json({
      message: 'Chat session created successfully',
      session
    });
  } catch (error) {
    console.error('Create chat session error:', error);
    res.status(500).json({ message: 'Server error creating chat session' });
  }
});

// Send message to chat session
router.post('/sessions/:sessionId/messages', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { content } = req.body;
    const { sessionId } = req.params;

    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Validate sessionId
    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    const user = await User.findById(req.user._id);

    // Add user message
    await session.addMessage({
      role: 'user',
      content,
      timestamp: new Date()
    });

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
      user.preferences,
      contextData ? {
        type: session.contextType,
        title: contextData.title,
        description: contextData.description
      } : null
    );

    // Add AI response
    await session.addMessage({
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      metadata: {
        model: response.model,
        tokens: response.usage?.total_tokens,
        responseTime: Date.now() - startTime
      }
    });

    res.json({
      message: 'Message sent successfully',
      response: {
        content: response.content,
        timestamp: new Date(),
        metadata: {
          model: response.model,
          tokens: response.usage?.total_tokens,
          responseTime: Date.now() - startTime
        }
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// Update chat session
router.put('/sessions/:sessionId', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { title, isActive } = req.body;
    const { sessionId } = req.params;

    // Validate sessionId
    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    if (title) session.title = title;
    if (typeof isActive === 'boolean') session.isActive = isActive;

    await session.save();

    res.json({
      message: 'Chat session updated successfully',
      session
    });
  } catch (error) {
    console.error('Update chat session error:', error);
    res.status(500).json({ message: 'Server error updating chat session' });
  }
});

// Delete chat session
router.delete('/sessions/:sessionId', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Validate sessionId
    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    await ChatSession.findByIdAndDelete(session._id);

    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Delete chat session error:', error);
    res.status(500).json({ message: 'Server error deleting chat session' });
  }
});

// Get chat statistics
router.get('/stats', authenticate, requireOnboarding, async (req, res) => {
  try {
    const totalSessions = await ChatSession.countDocuments({ 
      userId: req.user._id 
    });

    const activeSessions = await ChatSession.countDocuments({ 
      userId: req.user._id,
      isActive: true 
    });

    const totalMessages = await ChatSession.aggregate([
      { $match: { userId: req.user._id } },
      { $project: { totalMessages: 1 } },
      { $group: { _id: null, total: { $sum: '$totalMessages' } } }
    ]);

    const recentSessions = await ChatSession.find({ 
      userId: req.user._id,
      isActive: true 
    })
    .sort({ lastMessageAt: -1 })
    .limit(5)
    .select('title contextType lastMessageAt totalMessages');

    res.json({
      stats: {
        totalSessions,
        activeSessions,
        totalMessages: totalMessages[0]?.total || 0,
        recentSessions
      }
    });
  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({ message: 'Server error fetching chat statistics' });
  }
});

export default router;