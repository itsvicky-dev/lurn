import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Topic from '../src/models/Topic.js';
import User from '../src/models/User.js';

// Load environment variables
dotenv.config();

async function testModels() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test Topic model transformation
    console.log('\n📋 Testing Topic model...');
    const topics = await Topic.find().limit(1);
    
    if (topics.length > 0) {
      const topic = topics[0];
      console.log('Raw topic from DB:', {
        _id: topic._id,
        id: topic.id,
        title: topic.title
      });
      
      const topicJSON = topic.toJSON();
      console.log('Topic after toJSON transformation:', {
        _id: topicJSON._id,
        id: topicJSON.id,
        title: topicJSON.title
      });
      
      if (topicJSON.id && !topicJSON._id) {
        console.log('✅ Topic ID transformation working correctly');
      } else {
        console.log('❌ Topic ID transformation not working');
      }
    } else {
      console.log('⚠️ No topics found in database');
    }

    // Test User model transformation
    console.log('\n👤 Testing User model...');
    const users = await User.find().limit(1);
    
    if (users.length > 0) {
      const user = users[0];
      const userJSON = user.toJSON();
      console.log('User after toJSON transformation:', {
        _id: userJSON._id,
        id: userJSON.id,
        email: userJSON.email,
        password: userJSON.password // Should be undefined
      });
      
      if (userJSON.id && !userJSON._id && !userJSON.password) {
        console.log('✅ User ID transformation working correctly');
      } else {
        console.log('❌ User ID transformation not working');
      }
    } else {
      console.log('⚠️ No users found in database');
    }

  } catch (error) {
    console.error('❌ Error testing models:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testModels();