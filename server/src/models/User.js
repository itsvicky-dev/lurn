import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  isOnboarded: {
    type: Boolean,
    default: false
  },
  preferences: {
    subjects: [{
      type: String,
      trim: true
    }],
    learningAge: {
      type: String,
      enum: ['child', 'teenager', 'adult', 'senior'],
      default: 'adult'
    },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    tutorPersonality: {
      type: String,
      enum: ['friendly', 'strict', 'funny', 'professional', 'encouraging'],
      default: 'friendly'
    },
    learningFormat: [{
      type: String,
      enum: ['text', 'visuals', 'images', 'charts', 'code', 'videos', 'audio'],
      default: ['text']
    }],
    language: {
      type: String,
      default: 'english'
    }
  },
  learningPaths: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath'
  }],
  progress: {
    totalModulesCompleted: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    streakDays: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date,
      default: Date.now
    }
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    expiresAt: Date,
    features: [{
      type: String
    }]
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Never send password to client
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update last active date and calculate streak
userSchema.methods.updateLastActive = function() {
  const now = new Date();
  const lastActive = this.progress.lastActiveDate;
  
  // Calculate streak days
  if (lastActive) {
    const daysDiff = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day - increment streak
      this.progress.streakDays += 1;
    } else if (daysDiff > 1) {
      // Missed days - reset streak
      this.progress.streakDays = 1;
    }
    // If daysDiff === 0, it's the same day, don't change streak
  } else {
    // First time - start streak
    this.progress.streakDays = 1;
  }
  
  this.progress.lastActiveDate = now;
  return this.save();
};

export default mongoose.model('User', userSchema);