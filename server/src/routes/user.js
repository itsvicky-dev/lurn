import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import aiService from '../services/aiService.js';
import LearningPath from '../models/LearningPath.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';

const router = express.Router();

// Complete onboarding
router.post('/onboarding', authenticate, async (req, res) => {
  try {
    const { subjects, learningAge, skillLevel, tutorPersonality, learningFormat, language } = req.body;

    // Validation
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: 'At least one subject is required' });
    }

    const validAges = ['child', 'teenager', 'adult', 'senior'];
    const validSkillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const validPersonalities = ['friendly', 'strict', 'funny', 'professional', 'encouraging'];
    const validFormats = ['text', 'visuals', 'images', 'charts', 'code', 'videos', 'audio'];

    if (!validAges.includes(learningAge)) {
      return res.status(400).json({ message: 'Invalid learning age' });
    }

    if (!validSkillLevels.includes(skillLevel)) {
      return res.status(400).json({ message: 'Invalid skill level' });
    }

    if (!validPersonalities.includes(tutorPersonality)) {
      return res.status(400).json({ message: 'Invalid tutor personality' });
    }

    if (!learningFormat || !Array.isArray(learningFormat) || 
        !learningFormat.every(format => validFormats.includes(format))) {
      return res.status(400).json({ message: 'Invalid learning format' });
    }

    // Update user preferences
    const user = await User.findById(req.user._id);
    user.preferences = {
      subjects,
      learningAge,
      skillLevel,
      tutorPersonality,
      learningFormat,
      language: language || 'english'
    };
    user.isOnboarded = true;

    await user.save();

    // Generate learning paths for each subject
    const learningPaths = [];
    
    for (const subject of subjects) {
      try {
        console.log(`Generating learning path for ${subject}...`);
        const pathData = await aiService.generateLearningPath(user.preferences, subject);
        
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

        // Create modules and topics
        const moduleIds = [];
        
        for (const moduleData of pathData.modules) {
          const module = new Module({
            learningPathId: learningPath._id,
            title: moduleData.title,
            description: moduleData.description,
            order: moduleData.order,
            estimatedDuration: moduleData.estimatedDuration,
            difficulty: moduleData.difficulty,
            learningObjectives: moduleData.learningObjectives || []
          });

          await module.save();
          moduleIds.push(module._id);

          // Create topics for this module
          const topicIds = [];
          
          for (const topicData of moduleData.topics) {
            const topic = new Topic({
              moduleId: module._id,
              title: topicData.title,
              description: topicData.description,
              order: topicData.order,
              estimatedDuration: topicData.estimatedDuration,
              difficulty: topicData.difficulty
            });

            await topic.save();
            topicIds.push(topic._id);
          }

          // Update module with topic references
          module.topics = topicIds;
          module.progress.totalTopics = topicIds.length;
          await module.save();
        }

        // Update learning path with module references
        learningPath.modules = moduleIds;
        learningPath.progress.totalModules = moduleIds.length;
        await learningPath.save();

        // Add to user's learning paths
        user.learningPaths.push(learningPath._id);
        learningPaths.push(learningPath);

      } catch (error) {
        console.error(`Error generating learning path for ${subject}:`, error);
        // Continue with other subjects even if one fails
      }
    }

    await user.save();

    res.json({
      message: 'Onboarding completed successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isOnboarded: user.isOnboarded,
        preferences: user.preferences
      },
      learningPaths: learningPaths.map(path => ({
        id: path._id,
        subject: path.subject,
        title: path.title,
        description: path.description,
        difficulty: path.difficulty,
        estimatedDuration: path.estimatedDuration,
        progress: path.progress,
        status: path.status
      }))
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ message: 'Server error during onboarding' });
  }
});

// Update preferences
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { subjects, learningAge, skillLevel, tutorPersonality, learningFormat, language } = req.body;

    const user = await User.findById(req.user._id);
    
    // Update only provided fields
    if (subjects) user.preferences.subjects = subjects;
    if (learningAge) user.preferences.learningAge = learningAge;
    if (skillLevel) user.preferences.skillLevel = skillLevel;
    if (tutorPersonality) user.preferences.tutorPersonality = tutorPersonality;
    if (learningFormat) user.preferences.learningFormat = learningFormat;
    if (language) user.preferences.language = language;

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error updating preferences' });
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'learningPaths',
        populate: {
          path: 'modules',
          populate: {
            path: 'topics'
          }
        }
      });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        isOnboarded: user.isOnboarded,
        preferences: user.preferences,
        progress: user.progress,
        learningPaths: user.learningPaths,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, avatar } = req.body;

    const user = await User.findById(req.user._id);
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Get user statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('learningPaths');
    
    const stats = {
      totalLearningPaths: user.learningPaths.length,
      totalModulesCompleted: user.progress.totalModulesCompleted,
      totalTimeSpent: user.progress.totalTimeSpent,
      streakDays: user.progress.streakDays,
      lastActiveDate: user.progress.lastActiveDate,
      learningPathsProgress: user.learningPaths.map(path => ({
        id: path._id,
        subject: path.subject,
        title: path.title,
        progress: path.progress,
        status: path.status
      }))
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

export default router;