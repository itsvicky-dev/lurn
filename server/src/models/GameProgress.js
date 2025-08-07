import mongoose from 'mongoose';

const categoryProgressSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  totalGames: {
    type: Number,
    default: 0
  },
  completedGames: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
});

const achievementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['streak', 'completion', 'score', 'speed', 'language', 'category'],
    required: true
  },
  requirement: {
    type: Number,
    required: true
  },
  progress: {
    type: Number,
    default: 0
  },
  isUnlocked: {
    type: Boolean,
    default: false
  },
  unlockedAt: {
    type: Date,
    default: null
  }
});

const gameProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalGamesPlayed: {
    type: Number,
    default: 0
  },
  totalGamesCompleted: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  streakDays: {
    type: Number,
    default: 0
  },
  lastPlayedDate: {
    type: Date,
    default: null
  },
  favoriteLanguage: {
    type: String,
    default: null
  },
  completionRate: {
    type: Number,
    default: 0
  },
  categoryProgress: [categoryProgressSchema],
  achievements: [achievementSchema],
  // Leaderboard stats
  weeklyPoints: {
    type: Number,
    default: 0
  },
  monthlyPoints: {
    type: Number,
    default: 0
  },
  weeklyGamesCompleted: {
    type: Number,
    default: 0
  },
  monthlyGamesCompleted: {
    type: Number,
    default: 0
  },
  lastWeeklyReset: {
    type: Date,
    default: Date.now
  },
  lastMonthlyReset: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for leaderboard queries
gameProgressSchema.index({ totalPoints: -1 });
gameProgressSchema.index({ weeklyPoints: -1 });
gameProgressSchema.index({ monthlyPoints: -1 });
gameProgressSchema.index({ userId: 1 });

// Method to update progress after completing a game
gameProgressSchema.methods.updateAfterGame = function(gameSession, game) {
  this.totalGamesPlayed += 1;
  
  if (gameSession.status === 'completed') {
    this.totalGamesCompleted += 1;
    this.totalPoints += gameSession.score;
    
    // Update weekly/monthly points
    this.weeklyPoints += gameSession.score;
    this.monthlyPoints += gameSession.score;
    this.weeklyGamesCompleted += 1;
    this.monthlyGamesCompleted += 1;
    
    // Update completion rate
    this.completionRate = (this.totalGamesCompleted / this.totalGamesPlayed) * 100;
    
    // Update average score
    this.averageScore = this.totalPoints / this.totalGamesCompleted;
    
    // Update category progress
    let categoryProgress = this.categoryProgress.find(cp => cp.category === game.category);
    if (!categoryProgress) {
      categoryProgress = {
        category: game.category,
        totalGames: 0,
        completedGames: 0,
        totalPoints: 0,
        averageScore: 0
      };
      this.categoryProgress.push(categoryProgress);
    }
    
    categoryProgress.totalGames += 1;
    categoryProgress.completedGames += 1;
    categoryProgress.totalPoints += gameSession.score;
    categoryProgress.averageScore = categoryProgress.totalPoints / categoryProgress.completedGames;
    
    // Update streak
    const today = new Date();
    const lastPlayed = this.lastPlayedDate;
    
    if (!lastPlayed) {
      this.streakDays = 1;
    } else {
      const daysDiff = Math.floor((today - lastPlayed) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        this.streakDays += 1;
      } else if (daysDiff > 1) {
        this.streakDays = 1;
      }
      // If daysDiff === 0, keep current streak
    }
    
    this.lastPlayedDate = today;
    
    // Update favorite language
    this.updateFavoriteLanguage(game.language);
    
    // Check and update achievements
    this.checkAchievements();
  }
  
  return this.save();
};

// Method to update favorite language
gameProgressSchema.methods.updateFavoriteLanguage = function(language) {
  // Simple implementation - could be more sophisticated
  this.favoriteLanguage = language;
};

// Method to check and unlock achievements
gameProgressSchema.methods.checkAchievements = function() {
  // Define achievements
  const achievementDefinitions = [
    {
      id: 'first_win',
      title: 'First Victory',
      description: 'Complete your first coding game',
      icon: '🏆',
      type: 'completion',
      requirement: 1
    },
    {
      id: 'streak_3',
      title: 'On Fire',
      description: 'Play games for 3 consecutive days',
      icon: '🔥',
      type: 'streak',
      requirement: 3
    },
    {
      id: 'streak_7',
      title: 'Week Warrior',
      description: 'Play games for 7 consecutive days',
      icon: '⚡',
      type: 'streak',
      requirement: 7
    },
    {
      id: 'points_1000',
      title: 'Point Master',
      description: 'Earn 1000 total points',
      icon: '💎',
      type: 'score',
      requirement: 1000
    },
    {
      id: 'games_10',
      title: 'Dedicated Player',
      description: 'Complete 10 games',
      icon: '🎮',
      type: 'completion',
      requirement: 10
    },
    {
      id: 'games_50',
      title: 'Game Master',
      description: 'Complete 50 games',
      icon: '👑',
      type: 'completion',
      requirement: 50
    }
  ];
  
  achievementDefinitions.forEach(def => {
    let existingAchievement = this.achievements.find(a => a.id === def.id);
    
    if (!existingAchievement) {
      existingAchievement = {
        ...def,
        progress: 0,
        isUnlocked: false,
        unlockedAt: null
      };
      this.achievements.push(existingAchievement);
    }
    
    if (!existingAchievement.isUnlocked) {
      // Update progress based on achievement type
      switch (def.type) {
        case 'completion':
          existingAchievement.progress = this.totalGamesCompleted;
          break;
        case 'streak':
          existingAchievement.progress = this.streakDays;
          break;
        case 'score':
          existingAchievement.progress = this.totalPoints;
          break;
      }
      
      // Check if achievement should be unlocked
      if (existingAchievement.progress >= def.requirement) {
        existingAchievement.isUnlocked = true;
        existingAchievement.unlockedAt = new Date();
      }
    }
  });
};

// Method to reset weekly/monthly stats
gameProgressSchema.methods.resetPeriodStats = function() {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  if (this.lastWeeklyReset < oneWeekAgo) {
    this.weeklyPoints = 0;
    this.weeklyGamesCompleted = 0;
    this.lastWeeklyReset = now;
  }
  
  if (this.lastMonthlyReset < oneMonthAgo) {
    this.monthlyPoints = 0;
    this.monthlyGamesCompleted = 0;
    this.lastMonthlyReset = now;
  }
};

const GameProgress = mongoose.model('GameProgress', gameProgressSchema);

export default GameProgress;