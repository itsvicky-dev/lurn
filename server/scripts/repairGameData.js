import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GameProgress from '../src/models/GameProgress.js';
import User from '../src/models/User.js';

dotenv.config();

const repairGameData = async () => {
  try {
    console.log('🔧 Starting game data repair...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check total GameProgress records
    const totalProgress = await GameProgress.countDocuments();
    console.log(`📊 Total GameProgress records: ${totalProgress}`);

    if (totalProgress === 0) {
      console.log('ℹ️ No GameProgress records found. This is normal for new installations.');
      return;
    }

    // Find GameProgress records with invalid user references
    const progressRecords = await GameProgress.find({}).lean();
    console.log(`🔍 Checking ${progressRecords.length} GameProgress records...`);

    const validUserIds = await User.find({}, '_id').lean();
    const validUserIdSet = new Set(validUserIds.map(u => u._id.toString()));

    let invalidRecords = 0;
    let repairedRecords = 0;

    for (const progress of progressRecords) {
      if (!validUserIdSet.has(progress.userId.toString())) {
        console.log(`❌ Found invalid user reference: ${progress.userId}`);
        invalidRecords++;
        
        // Remove invalid GameProgress record
        await GameProgress.deleteOne({ _id: progress._id });
        repairedRecords++;
        console.log(`🗑️ Removed invalid GameProgress record for user ${progress.userId}`);
      }
    }

    console.log(`\n📈 Repair Summary:`);
    console.log(`  - Total records checked: ${progressRecords.length}`);
    console.log(`  - Invalid records found: ${invalidRecords}`);
    console.log(`  - Records repaired: ${repairedRecords}`);

    // Test leaderboard query
    console.log('\n🧪 Testing leaderboard query...');
    try {
      const leaderboardData = await GameProgress.find({ totalPoints: { $gt: 0 } })
        .populate('userId', 'firstName lastName avatar')
        .sort({ totalPoints: -1 })
        .limit(10)
        .lean();

      console.log(`✅ Leaderboard query successful: ${leaderboardData.length} entries`);
      
      if (leaderboardData.length > 0) {
        console.log('📋 Sample leaderboard entries:');
        leaderboardData.slice(0, 3).forEach((entry, index) => {
          console.log(`  ${index + 1}. ${entry.userId?.firstName || 'Unknown'} ${entry.userId?.lastName || 'User'} - ${entry.totalPoints} points`);
        });
      }
    } catch (error) {
      console.error('❌ Leaderboard query failed:', error.message);
    }

    console.log('\n✅ Game data repair completed!');

  } catch (error) {
    console.error('❌ Repair failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the repair
repairGameData();