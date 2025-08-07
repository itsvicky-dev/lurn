import express from 'express';
import LearningPath from '../models/LearningPath.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import User from '../models/User.js';
import { authenticate, requireOnboarding } from '../middleware/auth.js';
import { validateLearningContent } from '../middleware/contentValidation.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// Test AI service endpoint
router.get('/test-ai', authenticate, async (req, res) => {
  try {
    console.log('Testing AI service...');
    const testResponse = await aiService.generateCompletion([
      { role: 'user', content: 'Say hello' }
    ], { maxTokens: 50 });
    
    res.json({ 
      success: true, 
      message: 'AI service is working',
      response: testResponse.content 
    });
  } catch (error) {
    console.error('AI service test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'AI service test failed',
      error: error.message 
    });
  }
});

// Get all learning paths for user
router.get('/paths', authenticate, requireOnboarding, validateLearningContent, async (req, res) => {
  try {
    const learningPaths = await LearningPath.find({ userId: req.user._id })
      .populate({
        path: 'modules',
        populate: {
          path: 'topics'
        }
      })
      .sort({ createdAt: -1 });

    res.json({ learningPaths });
  } catch (error) {
    console.error('Get learning paths error:', error);
    res.status(500).json({ message: 'Server error fetching learning paths' });
  }
});

// Get specific learning path
router.get('/paths/:pathId', authenticate, requireOnboarding, async (req, res) => {
  try {
    const learningPath = await LearningPath.findOne({
      _id: req.params.pathId,
      userId: req.user._id
    }).populate({
      path: 'modules',
      populate: {
        path: 'topics'
      }
    });

    if (!learningPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    res.json({ learningPath });
  } catch (error) {
    console.error('Get learning path error:', error);
    res.status(500).json({ message: 'Server error fetching learning path' });
  }
});

// Get specific module
router.get('/modules/:moduleId', authenticate, requireOnboarding, async (req, res) => {
  try {
    const module = await Module.findById(req.params.moduleId)
      .populate('topics')
      .populate('learningPathId');

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Check if user owns this module
    if (module.learningPathId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ module });
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({ message: 'Server error fetching module' });
  }
});

// Get specific topic with content generation
router.get('/topics/:topicId', authenticate, requireOnboarding, async (req, res) => {
  try {
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

    // Generate content if not already generated
    if (!topic.isContentGenerated) {
      try {
        console.log(`Generating content for topic: ${topic.title}`);
        
        const user = await User.findById(req.user._id);
        const contentData = await aiService.generateTopicContent(
          topic,
          user.preferences,
          topic.moduleId
        );

        // Update topic with generated content
        topic.content = contentData.content;
        topic.quiz = contentData.quiz;
        topic.isContentGenerated = true;
        topic.contentGeneratedAt = new Date();

        await topic.save();
        
        console.log(`Content generated successfully for topic: ${topic.title}`);
      } catch (error) {
        console.error('Error generating topic content:', error);
        
        // If it's a timeout or parsing error, mark the topic as needing regeneration
        if (error.message.includes('timeout') || error.message.includes('parse')) {
          topic.isContentGenerated = false;
          topic.contentGenerationError = error.message;
          topic.lastGenerationAttempt = new Date();
          await topic.save();
        }
        
        // Continue with existing content if generation fails, but inform the client
        if (!topic.content || !topic.content.text) {
          return res.status(503).json({ 
            message: 'Content generation failed and no cached content available. Please try again later.',
            error: error.message,
            canRetry: true
          });
        }
      }
    }

    // Update user progress for this topic
    const userProgress = topic.getUserProgress(req.user._id);
    if (!userProgress) {
      await topic.updateUserProgress(req.user._id, {
        status: 'in_progress',
        lastAccessedAt: new Date()
      });
    } else {
      userProgress.lastAccessedAt = new Date();
      await topic.save();
    }

    res.json({ topic });
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({ message: 'Server error fetching topic' });
  }
});

// Retry topic content generation
router.post('/topics/:topicId/retry-generation', authenticate, requireOnboarding, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.topicId).populate('moduleId');
    
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Rate limiting: prevent retry if attempted within last 5 minutes
    if (topic.lastGenerationAttempt) {
      const timeSinceLastAttempt = Date.now() - topic.lastGenerationAttempt.getTime();
      const minRetryInterval = 5 * 60 * 1000; // 5 minutes
      
      if (timeSinceLastAttempt < minRetryInterval) {
        const remainingTime = Math.ceil((minRetryInterval - timeSinceLastAttempt) / 1000 / 60);
        return res.status(429).json({ 
          message: `Please wait ${remainingTime} more minutes before retrying`,
          canRetry: false,
          retryAfter: remainingTime
        });
      }
    }

    console.log(`Retrying content generation for topic: ${topic.title}`);
    
    const user = await User.findById(req.user._id);
    const contentData = await aiService.generateTopicContent(
      topic,
      user.preferences,
      topic.moduleId
    );

    // Update topic with generated content
    topic.content = contentData.content;
    topic.quiz = contentData.quiz;
    topic.isContentGenerated = true;
    topic.contentGeneratedAt = new Date();
    topic.contentGenerationError = null;
    topic.lastGenerationAttempt = null;

    await topic.save();
    
    console.log(`Content regenerated successfully for topic: ${topic.title}`);
    res.json({ 
      message: 'Content generated successfully',
      topic 
    });
  } catch (error) {
    console.error('Error retrying topic content generation:', error);
    res.status(500).json({ 
      message: 'Failed to regenerate content',
      error: error.message,
      canRetry: true
    });
  }
});

// Mark topic as completed
router.post('/topics/:topicId/complete', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { timeSpent, notes } = req.body;

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

    // Update topic progress
    await topic.updateUserProgress(req.user._id, {
      status: 'completed',
      timeSpent: timeSpent || 0,
      completedAt: new Date(),
      notes: notes || ''
    });

    // Update module progress
    const module = topic.moduleId;
    const completedTopics = await Topic.countDocuments({
      moduleId: module._id,
      'userProgress.userId': req.user._id,
      'userProgress.status': 'completed'
    });

    const wasModuleCompleted = module.status === 'completed';
    module.progress.completedTopics = completedTopics;
    module.progress.timeSpent += timeSpent || 0;
    await module.updateProgress();

    // Update learning path progress
    const learningPath = module.learningPathId;
    const completedModules = await Module.countDocuments({
      learningPathId: learningPath._id,
      status: 'completed'
    });

    learningPath.progress.completedModules = completedModules;
    learningPath.progress.timeSpent += timeSpent || 0;
    await learningPath.updateProgress();

    // Update user overall progress
    const user = await User.findById(req.user._id);
    user.progress.totalTimeSpent += timeSpent || 0;
    
    // Only increment completed modules count if module just became completed
    if (!wasModuleCompleted && module.status === 'completed') {
      user.progress.totalModulesCompleted += 1;
    }
    
    await user.updateLastActive();

    // Prepare response data
    const responseData = {
      message: 'Topic marked as completed',
      topicProgress: topic.getUserProgress(req.user._id),
      moduleProgress: module.progress,
      learningPathProgress: learningPath.progress,
      notifications: []
    };

    // Add notifications for achievements
    if (!wasModuleCompleted && module.status === 'completed') {
      responseData.notifications.push({
        type: 'success',
        title: 'Module Completed! 🎉',
        message: `Congratulations! You've completed the "${module.title}" module.`,
        actionUrl: `/learning/paths/${learningPath._id}`
      });
    }

    if (learningPath.status === 'completed') {
      responseData.notifications.push({
        type: 'success',
        title: 'Learning Path Completed! 🏆',
        message: `Amazing! You've completed the entire "${learningPath.title}" learning path.`,
        actionUrl: '/learning'
      });
    }

    // Check for streak milestones
    if (user.progress.streakDays > 0 && user.progress.streakDays % 7 === 0) {
      responseData.notifications.push({
        type: 'success',
        title: `${user.progress.streakDays} Day Streak! 🔥`,
        message: `You're on fire! Keep up the amazing learning streak.`,
        actionUrl: '/dashboard'
      });
    }

    res.json(responseData);
  } catch (error) {
    console.error('Complete topic error:', error);
    res.status(500).json({ message: 'Server error completing topic' });
  }
});

// Submit quiz answers
router.post('/topics/:topicId/quiz', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { answers } = req.body;

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

    if (!topic.quiz || !topic.quiz.questions || topic.quiz.questions.length === 0) {
      return res.status(400).json({ message: 'No quiz available for this topic' });
    }

    // Calculate score
    let correctAnswers = 0;
    const results = topic.quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      return {
        questionIndex: index,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      };
    });

    const score = Math.round((correctAnswers / topic.quiz.questions.length) * 100);
    const passed = score >= (topic.quiz.passingScore || 70);

    res.json({
      score,
      passed,
      correctAnswers,
      totalQuestions: topic.quiz.questions.length,
      results
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error submitting quiz' });
  }
});

// Test endpoint for long-running requests
router.post('/paths/test', authenticate, async (req, res) => {
  console.log('🧪 Test endpoint called');
  
  try {
    // Simulate a long-running operation
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    
    console.log('🧪 Test response being sent');
    const testResponse = { 
      message: 'Test successful', 
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substr(2, 9)
    };
    
    res.json(testResponse);
    console.log('🧪 Test response sent successfully');
  } catch (error) {
    console.error('🧪 Test endpoint error:', error);
    res.status(500).json({ message: 'Test failed', error: error.message });
  }
});

// Create new learning path for additional subject
router.post('/paths', authenticate, requireOnboarding, async (req, res) => {
  const startTime = Date.now();
  
  // Handle client disconnect
  req.on('close', () => {
    console.log('⚠️ Client disconnected during learning path generation');
  });
  
  req.on('aborted', () => {
    console.log('⚠️ Request aborted during learning path generation');
  });
  
  try {
    const { subject, preferences } = req.body;

    if (!subject) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    console.log(`🚀 Starting learning path generation for: ${subject}`);
    
    const user = await User.findById(req.user._id);
    
    // Use provided preferences or user's default preferences
    const userPreferences = preferences || user.preferences;

    try {
      console.log(`📝 Generating AI content for ${subject}...`);
      console.log(`👤 User preferences:`, {
        skillLevel: userPreferences.skillLevel,
        learningAge: userPreferences.learningAge,
        tutorPersonality: userPreferences.tutorPersonality
      });
      
      // Generate learning path with AI service (timeout handled internally)
      const batchSize = preferences?.batchSize || 'initial';
      const pathData = await aiService.generateLearningPath(userPreferences, subject, batchSize);
      
      console.log(`✅ AI content generated successfully in ${Date.now() - startTime}ms`);
      console.log(`📊 Generated path: ${pathData.title} with ${pathData.modules?.length || 0} modules`);
      
      // Create learning path
      const learningPath = new LearningPath({
        userId: user._id,
        subject,
        title: pathData.title,
        description: pathData.description,
        difficulty: pathData.difficulty,
        estimatedDuration: pathData.estimatedDuration,
        prerequisites: pathData.prerequisites || [],
        learningObjectives: pathData.learningObjectives || [],
        tags: pathData.tags || []
      });

      await learningPath.save();
      console.log(`💾 Learning path saved with ID: ${learningPath._id}`);

      // Create modules and topics
      const moduleIds = [];
      
      if (pathData.modules && Array.isArray(pathData.modules)) {
        for (let i = 0; i < pathData.modules.length; i++) {
          const moduleData = pathData.modules[i];
          console.log(`📚 Creating module ${i + 1}/${pathData.modules.length}: ${moduleData.title}`);
          
          const module = new Module({
            learningPathId: learningPath._id,
            title: moduleData.title,
            description: moduleData.description,
            order: moduleData.order || i + 1,
            estimatedDuration: moduleData.estimatedDuration || 60,
            difficulty: moduleData.difficulty || pathData.difficulty,
            learningObjectives: moduleData.learningObjectives || []
          });

          await module.save();
          moduleIds.push(module._id);

          // Create topics for this module
          const topicIds = [];
          
          if (moduleData.topics && Array.isArray(moduleData.topics)) {
            for (let j = 0; j < moduleData.topics.length; j++) {
              const topicData = moduleData.topics[j];
              console.log(`  📖 Creating topic ${j + 1}/${moduleData.topics.length}: ${topicData.title}`);
              
              const topic = new Topic({
                moduleId: module._id,
                title: topicData.title,
                description: topicData.description,
                order: topicData.order || j + 1,
                estimatedDuration: topicData.estimatedDuration || 30,
                difficulty: topicData.difficulty || moduleData.difficulty || pathData.difficulty
              });

              await topic.save();
              topicIds.push(topic._id);
            }
          }

          // Update module with topic references
          module.topics = topicIds;
          module.progress.totalTopics = topicIds.length;
          await module.save();
          
          console.log(`  ✅ Module "${moduleData.title}" created with ${topicIds.length} topics`);
        }
      }

      // Update learning path with module references
      console.log(`📝 Updating learning path with ${moduleIds.length} module references...`);
      try {
        learningPath.modules = moduleIds;
        learningPath.progress.totalModules = moduleIds.length;
        await learningPath.save();
        console.log(`✅ Learning path updated successfully`);
      } catch (saveError) {
        console.error('❌ Error saving learning path:', saveError);
        throw saveError;
      }

      // Add to user's learning paths
      console.log(`👤 Adding learning path to user's collection...`);
      try {
        user.learningPaths.push(learningPath._id);
        await user.save();
        console.log(`✅ User updated successfully`);
      } catch (userSaveError) {
        console.error('❌ Error updating user:', userSaveError);
        throw userSaveError;
      }

      const totalTime = Date.now() - startTime;
      console.log(`🎉 Learning path creation completed in ${totalTime}ms`);
      console.log(`📈 Created: ${moduleIds.length} modules with learning path "${pathData.title}"`);

      const responseData = {
        message: 'Learning path created successfully',
        learningPath: {
          id: learningPath._id.toString(),
          subject: learningPath.subject,
          title: learningPath.title,
          description: learningPath.description,
          difficulty: learningPath.difficulty,
          estimatedDuration: learningPath.estimatedDuration,
          progress: learningPath.progress,
          status: learningPath.status,
          modules: moduleIds.length,
          createdAt: learningPath.createdAt,
          updatedAt: learningPath.updatedAt
        },
        generationTime: totalTime
      };
      
      console.log(`📊 Response data prepared:`, {
        message: responseData.message,
        learningPathId: responseData.learningPath.id,
        title: responseData.learningPath.title,
        modules: responseData.learningPath.modules
      });

      console.log(`📤 Sending response to client...`);
      console.log(`🔍 Connection status - Headers sent: ${res.headersSent}, Request aborted: ${req.aborted}, Response writable: ${res.writable}`);
      
      // Check if response is still writable
      if (res.headersSent) {
        console.log('⚠️ Headers already sent, cannot send response');
        return;
      }
      
      if (req.aborted) {
        console.log('⚠️ Request was aborted, not sending response');
        return;
      }
      
      if (!res.writable) {
        console.log('⚠️ Response is not writable, cannot send response');
        return;
      }
      
      try {
        // Try sending a minimal response first to test
        const minimalResponse = {
          message: 'Learning path created successfully',
          learningPath: {
            id: learningPath._id.toString(),
            subject: learningPath.subject,
            title: learningPath.title,
            description: learningPath.description,
            difficulty: learningPath.difficulty,
            estimatedDuration: learningPath.estimatedDuration,
            progress: learningPath.progress,
            status: learningPath.status,
            modules: moduleIds.length,
            createdAt: learningPath.createdAt,
            updatedAt: learningPath.updatedAt
          },
          generationTime: totalTime
        };
        
        console.log(`📤 Attempting to send minimal response...`);
        res.status(201).json(minimalResponse);
        console.log(`✅ Response sent successfully`);
      } catch (responseError) {
        console.error('❌ Error sending response:', responseError);
        console.error('❌ Response error stack:', responseError.stack);
        // Try to send a simple error response if possible
        if (!res.headersSent) {
          try {
            res.status(500).json({ message: 'Error sending response' });
          } catch (fallbackError) {
            console.error('❌ Even fallback response failed:', fallbackError);
          }
        }
      }
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ Error generating learning path for ${subject} after ${totalTime}ms:`, error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to generate learning path';
      if (error.message.includes('timeout')) {
        errorMessage = 'Learning path generation timed out. The AI model is taking longer than expected to generate comprehensive content. This can happen with free AI models due to high demand. Please try again in a few minutes, or consider using a simpler subject name.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'AI service rate limit reached. The free AI model has reached its usage limit. Please try again in a few hours or try a different subject.';
      } else if (error.message.includes('authentication')) {
        errorMessage = 'AI service authentication failed. Please check the configuration.';
      } else if (error.message.includes('parse')) {
        errorMessage = 'AI generated invalid content format. The AI model returned malformed data. Please try again with a more specific subject.';
      } else if (error.message.includes('unavailable')) {
        errorMessage = 'AI service is temporarily unavailable. The AI model is currently overloaded. Please try again in a few minutes.';
      }
      
      res.status(500).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        generationTime: totalTime
      });
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Server error creating learning path after ${totalTime}ms:`, error);
    res.status(500).json({ 
      message: 'Server error creating learning path',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      generationTime: totalTime
    });
  }
});

// Generate additional modules for a learning path
router.post('/paths/:pathId/modules/generate', authenticate, requireOnboarding, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { pathId } = req.params;
    const { count = 5 } = req.body;

    const learningPath = await LearningPath.findOne({
      _id: pathId,
      userId: req.user._id
    }).populate('modules');

    if (!learningPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    console.log(`🚀 Generating ${count} additional modules for: ${learningPath.title}`);
    
    const user = await User.findById(req.user._id);
    
    try {
      const additionalModules = await Promise.race([
        aiService.generateAdditionalModules(user.preferences, learningPath.subject, learningPath.modules, count),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI generation timeout after 120 seconds')), 120000)
        )
      ]);
      
      console.log(`✅ Generated ${additionalModules.length} additional modules`);
      
      // Create the new modules
      const moduleIds = [];
      
      for (let i = 0; i < additionalModules.length; i++) {
        const moduleData = additionalModules[i];
        console.log(`📚 Creating additional module ${i + 1}/${additionalModules.length}: ${moduleData.title}`);
        
        const module = new Module({
          learningPathId: learningPath._id,
          title: moduleData.title,
          description: moduleData.description,
          order: moduleData.order,
          estimatedDuration: moduleData.estimatedDuration || 240,
          difficulty: moduleData.difficulty || learningPath.difficulty,
          learningObjectives: moduleData.learningObjectives || []
        });

        await module.save();
        moduleIds.push(module._id);

        // Create topics for this module
        const topicIds = [];
        
        if (moduleData.topics && Array.isArray(moduleData.topics)) {
          for (let j = 0; j < moduleData.topics.length; j++) {
            const topicData = moduleData.topics[j];
            console.log(`  📖 Creating topic ${j + 1}/${moduleData.topics.length}: ${topicData.title}`);
            
            const topic = new Topic({
              moduleId: module._id,
              title: topicData.title,
              description: topicData.description,
              order: topicData.order || j + 1,
              estimatedDuration: topicData.estimatedDuration || 45,
              difficulty: topicData.difficulty || moduleData.difficulty || learningPath.difficulty
            });

            await topic.save();
            topicIds.push(topic._id);
          }
        }

        // Update module with topic references
        module.topics = topicIds;
        module.progress.totalTopics = topicIds.length;
        await module.save();
        
        console.log(`  ✅ Additional module "${moduleData.title}" created with ${topicIds.length} topics`);
      }

      // Update learning path with new module references
      learningPath.modules.push(...moduleIds);
      learningPath.progress.totalModules = learningPath.modules.length;
      await learningPath.save();

      const totalTime = Date.now() - startTime;
      console.log(`🎉 Additional modules creation completed in ${totalTime}ms`);

      res.json({
        message: 'Additional modules generated successfully',
        modulesAdded: moduleIds.length,
        totalModules: learningPath.modules.length,
        generationTime: totalTime
      });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ Error generating additional modules after ${totalTime}ms:`, error);
      
      let errorMessage = 'Failed to generate additional modules';
      if (error.message.includes('timeout')) {
        errorMessage = 'Module generation timed out. Please try again.';
      }
      
      res.status(500).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        generationTime: totalTime
      });
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Server error generating additional modules after ${totalTime}ms:`, error);
    res.status(500).json({ 
      message: 'Server error generating additional modules',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      generationTime: totalTime
    });
  }
});

// Generate additional topics for a module
router.post('/modules/:moduleId/topics/generate', authenticate, requireOnboarding, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { moduleId } = req.params;
    const { count = 5 } = req.body;

    const module = await Module.findById(moduleId)
      .populate('topics')
      .populate('learningPathId');

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Check if user owns this module
    if (module.learningPathId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log(`🚀 Generating ${count} additional topics for module: ${module.title}`);
    
    const user = await User.findById(req.user._id);
    
    try {
      const additionalTopics = await Promise.race([
        aiService.generateAdditionalTopics(user.preferences, module, module.topics, count),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI generation timeout after 90 seconds')), 90000)
        )
      ]);
      
      console.log(`✅ Generated ${additionalTopics.length} additional topics`);
      
      // Create the new topics
      const topicIds = [];
      
      for (let i = 0; i < additionalTopics.length; i++) {
        const topicData = additionalTopics[i];
        console.log(`📖 Creating additional topic ${i + 1}/${additionalTopics.length}: ${topicData.title}`);
        
        const topic = new Topic({
          moduleId: module._id,
          title: topicData.title,
          description: topicData.description,
          order: topicData.order,
          estimatedDuration: topicData.estimatedDuration || 45,
          difficulty: topicData.difficulty || module.difficulty
        });

        await topic.save();
        topicIds.push(topic._id);
      }

      // Update module with new topic references
      module.topics.push(...topicIds);
      module.progress.totalTopics = module.topics.length;
      await module.save();

      const totalTime = Date.now() - startTime;
      console.log(`🎉 Additional topics creation completed in ${totalTime}ms`);

      res.json({
        message: 'Additional topics generated successfully',
        topicsAdded: topicIds.length,
        totalTopics: module.topics.length,
        generationTime: totalTime
      });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ Error generating additional topics after ${totalTime}ms:`, error);
      
      let errorMessage = 'Failed to generate additional topics';
      if (error.message.includes('timeout')) {
        errorMessage = 'Topic generation timed out. Please try again.';
      }
      
      res.status(500).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        generationTime: totalTime
      });
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Server error generating additional topics after ${totalTime}ms:`, error);
    res.status(500).json({ 
      message: 'Server error generating additional topics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      generationTime: totalTime
    });
  }
});

export default router;