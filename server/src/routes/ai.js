import express from 'express';
import { authenticate, requireOnboarding } from '../middleware/auth.js';
import aiService from '../services/aiService.js';
import mediaService from '../services/mediaService.js';
import User from '../models/User.js';
import Topic from '../models/Topic.js';
import Module from '../models/Module.js';
import LearningPath from '../models/LearningPath.js';

const router = express.Router();

// Generate visual aids for a topic
router.post('/visual-aids/:topicId', authenticate, requireOnboarding, async (req, res) => {
  try {
    console.log('Visual aids request for topic ID:', req.params.topicId);
    
    if (!req.params.topicId || req.params.topicId === 'undefined') {
      return res.status(400).json({ message: 'Invalid topic ID' });
    }
    
    const topic = await Topic.findById(req.params.topicId)
      .populate({
        path: 'moduleId',
        populate: {
          path: 'learningPathId'
        }
      });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Check if user owns this topic
    if (topic.moduleId.learningPathId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.user._id);
    
    // Extract subject/language from learning path title or topic content
    const learningPath = topic.moduleId.learningPathId;
    const subject = learningPath.title || learningPath.subject || '';
    
    // Generate visual aids using media service with subject context
    const mediaResults = await mediaService.generateRelevantMedia(
      topic.title,
      topic.description,
      topic.content?.keyPoints || [],
      user.preferences.learningFormat,
      subject
    );

    // Convert to visual aids format
    const visualAids = [];
    
    // Add images
    mediaResults.images.forEach(image => {
      visualAids.push({
        type: 'image',
        url: image.url,
        caption: image.caption || image.title,
        description: `Visual representation of ${topic.title}`,
        source: image.source,
        thumbnail: image.thumbnail,
        author: image.author,
        authorUrl: image.authorUrl
      });
    });
    
    // Add videos
    mediaResults.videos.forEach(video => {
      visualAids.push({
        type: 'video',
        url: video.url,
        embedUrl: video.embedUrl,
        caption: video.title,
        description: video.description,
        source: video.source,
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle,
        publishedAt: video.publishedAt
      });
    });

    // Update topic with new visual aids
    if (visualAids.length > 0) {
      if (!topic.content.visualAids) {
        topic.content.visualAids = [];
      }
      topic.content.visualAids.push(...visualAids);
      await topic.save();
    }

    res.json({ 
      visualAids,
      message: `Generated ${visualAids.length} visual aids for the topic`
    });
  } catch (error) {
    console.error('Generate visual aids error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('API key')) {
      res.status(500).json({ message: 'Media API configuration error. Please check API keys.' });
    } else if (error.message.includes('rate limit')) {
      res.status(429).json({ message: 'Rate limit exceeded. Please try again later.' });
    } else if (error.message.includes('network')) {
      res.status(503).json({ message: 'Network error accessing media services.' });
    } else {
      res.status(500).json({ 
        message: 'Server error generating visual aids',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// Regenerate topic content
router.post('/regenerate-content/:topicId', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { preferences } = req.body;

    const topic = await Topic.findById(req.params.topicId)
      .populate({
        path: 'moduleId',
        populate: {
          path: 'learningPathId'
        }
      });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Check if user owns this topic
    if (topic.moduleId.learningPathId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.user._id);
    const userPreferences = preferences || user.preferences;

    console.log(`Regenerating content for topic: ${topic.title}`);
    
    const contentData = await aiService.generateTopicContent(
      topic,
      userPreferences,
      topic.moduleId
    );

    // Update topic with regenerated content
    topic.content = contentData.content;
    topic.quiz = contentData.quiz;
    topic.isContentGenerated = true;
    topic.contentGeneratedAt = new Date();

    await topic.save();

    res.json({
      message: 'Content regenerated successfully',
      topic: {
        id: topic._id,
        title: topic.title,
        content: topic.content,
        quiz: topic.quiz,
        contentGeneratedAt: topic.contentGeneratedAt
      }
    });
  } catch (error) {
    console.error('Regenerate content error:', error);
    res.status(500).json({ message: 'Server error regenerating content' });
  }
});

// Generate additional learning path
router.post('/generate-path', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { subject, customPreferences } = req.body;

    if (!subject) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    const user = await User.findById(req.user._id);
    const preferences = customPreferences || user.preferences;

    const pathData = await aiService.generateLearningPath(preferences, subject);

    res.json({
      message: 'Learning path generated successfully',
      pathData
    });
  } catch (error) {
    console.error('Generate learning path error:', error);
    res.status(500).json({ message: 'Server error generating learning path' });
  }
});

// Get AI tutor response for general questions
router.post('/ask', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const user = await User.findById(req.user._id);
    
    let contextData = null;
    if (context && context.type && context.id) {
      // Get context information based on type
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

    const messages = [
      { role: 'user', content: question }
    ];

    const response = await aiService.generateChatResponse(
      messages,
      user.preferences,
      contextData ? {
        type: context.type,
        title: contextData.title,
        description: contextData.description
      } : null
    );

    res.json({
      response: response.content,
      metadata: {
        model: response.model,
        usage: response.usage
      }
    });
  } catch (error) {
    console.error('AI ask error:', error);
    res.status(500).json({ message: 'Server error processing AI request' });
  }
});

// Explain code snippet
router.post('/explain-code', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { code, language, context } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Code is required' });
    }

    const user = await User.findById(req.user._id);
    
    const response = await aiService.explainCode(
      code,
      language || 'javascript',
      context,
      user.preferences
    );

    res.json({
      explanation: response.content,
      metadata: {
        model: response.model,
        usage: response.usage
      }
    });
  } catch (error) {
    console.error('Explain code error:', error);
    res.status(500).json({ message: 'Server error explaining code' });
  }
});

// Generate practice exercises
router.post('/practice-exercises/:topicId', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { difficulty, count = 3 } = req.body;

    const topic = await Topic.findById(req.params.topicId)
      .populate({
        path: 'moduleId',
        populate: {
          path: 'learningPathId'
        }
      });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Check if user owns this topic
    if (topic.moduleId.learningPathId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.user._id);
    
    const exercises = await aiService.generatePracticeExercises(
      topic.title,
      difficulty || user.preferences.skillLevel,
      count,
      user.preferences
    );

    res.json({ exercises });
  } catch (error) {
    console.error('Generate practice exercises error:', error);
    res.status(500).json({ message: 'Server error generating practice exercises' });
  }
});

// Get code suggestions and help
router.post('/code-suggestions', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { code, language, issue } = req.body;

    if (!code || !language || !issue) {
      return res.status(400).json({ message: 'Code, language, and issue description are required' });
    }

    const user = await User.findById(req.user._id);
    
    const response = await aiService.generateCodeSuggestions(
      code,
      language,
      issue,
      user.preferences
    );

    res.json({
      suggestions: response.content,
      metadata: {
        model: response.model,
        usage: response.usage
      }
    });
  } catch (error) {
    console.error('Generate code suggestions error:', error);
    res.status(500).json({ message: 'Server error generating code suggestions' });
  }
});

// Code review
router.post('/code-review', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }

    const user = await User.findById(req.user._id);
    
    const response = await aiService.generateCodeReview(
      code,
      language,
      user.preferences
    );

    res.json({
      review: response.content,
      metadata: {
        model: response.model,
        usage: response.usage
      }
    });
  } catch (error) {
    console.error('Generate code review error:', error);
    res.status(500).json({ message: 'Server error generating code review' });
  }
});

// Generate coding exercises by topic name (not tied to specific learning path topic)
router.post('/coding-exercises', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { topic, difficulty, count = 5, language } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const user = await User.findById(req.user._id);
    
    const exercises = await aiService.generatePracticeExercises(
      `${topic}${language ? ` in ${language}` : ''}`,
      difficulty || user.preferences.skillLevel,
      count,
      user.preferences
    );

    res.json({ exercises });
  } catch (error) {
    console.error('Generate coding exercises error:', error);
    res.status(500).json({ message: 'Server error generating coding exercises' });
  }
});

// Get AI service model statistics (for debugging and monitoring)
router.get('/model-stats', authenticate, async (req, res) => {
  try {
    // Only allow admin users or in development mode
    if (process.env.NODE_ENV !== 'development' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = aiService.getModelStats();
    const serviceHealth = await aiService.checkServiceHealth();
    
    res.json({
      ...stats,
      serviceHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get model stats error:', error);
    res.status(500).json({ message: 'Server error getting model statistics' });
  }
});

// Force reset rate limits (for debugging)
router.post('/reset-rate-limits', authenticate, async (req, res) => {
  try {
    // Only allow admin users or in development mode
    if (process.env.NODE_ENV !== 'development' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Clear all rate limited models
    aiService.rateLimitedModels.clear();
    
    // Reset success rates to default
    aiService.modelPool.forEach(modelInfo => {
      modelInfo.successRate = 1.0;
    });
    
    // Clear model stats
    aiService.modelStats.clear();
    
    // Reset API key rate limits
    const clearedApiKeys = aiService.apiKeyManager.resetRateLimits();
    
    console.log('🔄 Rate limits and model stats reset by admin');
    
    res.json({ 
      message: 'Rate limits and model statistics reset successfully',
      clearedApiKeys,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Reset rate limits error:', error);
    res.status(500).json({ message: 'Server error resetting rate limits' });
  }
});

// Add new API key dynamically
router.post('/add-api-key', authenticate, async (req, res) => {
  try {
    // Only allow admin users or in development mode
    if (process.env.NODE_ENV !== 'development' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { apiKey } = req.body;
    
    if (!apiKey || !apiKey.startsWith('sk-or-v1-')) {
      return res.status(400).json({ message: 'Invalid OpenRouter API key format' });
    }

    const added = aiService.apiKeyManager.addApiKey(apiKey);
    
    if (added) {
      console.log('➕ New API key added by admin');
      res.json({ 
        message: 'API key added successfully',
        totalKeys: aiService.apiKeyManager.apiKeys.length,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({ message: 'API key already exists or is invalid' });
    }
  } catch (error) {
    console.error('Add API key error:', error);
    res.status(500).json({ message: 'Server error adding API key' });
  }
});

// Get API key statistics
router.get('/api-key-stats', authenticate, async (req, res) => {
  try {
    // Only allow admin users or in development mode
    if (process.env.NODE_ENV !== 'development' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = aiService.apiKeyManager.getKeyStats();
    
    res.json({
      ...stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get API key stats error:', error);
    res.status(500).json({ message: 'Server error getting API key statistics' });
  }
});

// Switch to next available API key manually
router.post('/switch-api-key', authenticate, async (req, res) => {
  try {
    // Only allow admin users or in development mode
    if (process.env.NODE_ENV !== 'development' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldKey = aiService.apiKeyManager.getKeyId(aiService.currentApiKey);
    const newKey = aiService.apiKeyManager.switchToNextKey();
    
    if (newKey) {
      aiService.updateHttpClient();
      console.log('🔄 API key switched manually by admin');
      
      res.json({ 
        message: 'API key switched successfully',
        oldKey,
        newKey: aiService.apiKeyManager.getKeyId(newKey),
        availableKeys: aiService.apiKeyManager.getAvailableKeysCount(),
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({ 
        message: 'No alternative API keys available',
        currentKey: oldKey
      });
    }
  } catch (error) {
    console.error('Switch API key error:', error);
    res.status(500).json({ message: 'Server error switching API key' });
  }
});

export default router;