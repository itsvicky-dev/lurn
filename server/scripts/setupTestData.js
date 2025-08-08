import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import Suggestion from '../src/models/Suggestion.js';
import dotenv from 'dotenv';

dotenv.config();

async function setupTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🍃 Connected to MongoDB');

    // Create test user
    const testUserData = {
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Test',
      lastName: 'User',
      isOnboarded: true,
      preferences: {
        subjects: ['javascript', 'react'],
        learningAge: 'adult',
        skillLevel: 'intermediate',
        tutorPersonality: 'friendly',
        learningFormat: ['text', 'code'],
        language: 'en'
      },
      progress: {
        totalModulesCompleted: 0,
        totalTimeSpent: 0,
        streakDays: 0,
        lastActiveDate: new Date().toISOString()
      },
      subscription: {
        type: 'free',
        features: ['basic_chat', 'basic_learning']
      }
    };

    // Create admin user
    const adminUserData = {
      email: 'admin@mail.com',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'Admin',
      lastName: 'User',
      isOnboarded: true,
      preferences: {
        subjects: ['javascript', 'react', 'node'],
        learningAge: 'adult',
        skillLevel: 'expert',
        tutorPersonality: 'professional',
        learningFormat: ['text', 'code', 'visuals'],
        language: 'en'
      },
      progress: {
        totalModulesCompleted: 0,
        totalTimeSpent: 0,
        streakDays: 0,
        lastActiveDate: new Date().toISOString()
      },
      subscription: {
        type: 'pro',
        features: ['unlimited_chat', 'advanced_learning', 'admin_access']
      }
    };

    // Check if users already exist
    let testUser = await User.findOne({ email: testUserData.email });
    if (!testUser) {
      testUser = await User.create(testUserData);
      console.log('✅ Test user created:', testUser.email);
    } else {
      console.log('ℹ️ Test user already exists:', testUser.email);
    }

    let adminUser = await User.findOne({ email: adminUserData.email });
    if (!adminUser) {
      adminUser = await User.create(adminUserData);
      console.log('✅ Admin user created:', adminUser.email);
    } else {
      console.log('ℹ️ Admin user already exists:', adminUser.email);
    }

    // Create some sample suggestions
    const sampleSuggestions = [
      {
        title: 'Add Dark Mode Toggle',
        description: 'It would be great to have a dark mode toggle in the settings to reduce eye strain during night time coding sessions. This would improve the user experience significantly.',
        category: 'ui/ux',
        submittedBy: testUser._id,
        submitterEmail: testUser.email,
        submitterName: `${testUser.firstName} ${testUser.lastName}`,
        tags: ['dark-mode', 'ui', 'accessibility'],
        status: 'approved'
      },
      {
        title: 'Python Learning Path',
        description: 'Please add a comprehensive Python learning path that covers basics to advanced topics including data structures, algorithms, web development with Flask/Django, and data science libraries.',
        category: 'content',
        submittedBy: testUser._id,
        submitterEmail: testUser.email,
        submitterName: `${testUser.firstName} ${testUser.lastName}`,
        tags: ['python', 'learning-path', 'content'],
        status: 'under_review'
      },
      {
        title: 'Code Execution Timeout Issue',
        description: 'Sometimes the code playground takes too long to execute simple scripts. There should be a timeout mechanism and better error handling.',
        category: 'bug',
        submittedBy: testUser._id,
        submitterEmail: testUser.email,
        submitterName: `${testUser.firstName} ${testUser.lastName}`,
        tags: ['playground', 'performance', 'bug'],
        status: 'pending'
      },
      {
        title: 'Mobile App Version',
        description: 'A mobile app would be fantastic for learning on the go. It could include offline content and push notifications for learning reminders.',
        category: 'feature',
        submittedBy: testUser._id,
        submitterEmail: testUser.email,
        submitterName: `${testUser.firstName} ${testUser.lastName}`,
        tags: ['mobile', 'app', 'offline'],
        status: 'pending'
      }
    ];

    // Check if suggestions already exist
    const existingSuggestions = await Suggestion.countDocuments();
    if (existingSuggestions === 0) {
      await Suggestion.insertMany(sampleSuggestions);
      console.log('✅ Sample suggestions created:', sampleSuggestions.length);
    } else {
      console.log('ℹ️ Suggestions already exist in database:', existingSuggestions);
    }

    console.log('\n🎉 Test data setup completed!');
    console.log('\nTest Credentials:');
    console.log('Regular User: test@example.com / password123');
    console.log('Admin User: admin@mail.com / admin123');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

setupTestData();