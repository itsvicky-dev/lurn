import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  content: {
    text: {
      type: String,
      default: ''
    },
    sections: [{
      title: String,
      content: String,
      visualSuggestion: String,
      type: {
        type: String,
        enum: ['definition', 'concept', 'example', 'implementation'],
        default: 'concept'
      }
    }],
    codeExamples: [{
      language: {
        type: String,
        required: true
      },
      code: {
        type: String,
        required: true
      },
      explanation: {
        type: String,
        required: true
      },
      isRunnable: {
        type: Boolean,
        default: false
      },
      visualSuggestion: String
    }],
    visualAids: [{
      type: {
        type: String,
        enum: ['image', 'chart', 'diagram', 'video'],
        required: true
      },
      url: String,
      embedUrl: String, // For YouTube embeds
      caption: String,
      description: String,
      source: String, // 'google', 'youtube', 'unsplash', etc.
      thumbnail: String, // Thumbnail URL
      width: Number,
      height: Number,
      author: String, // For attribution
      authorUrl: String // For attribution link
    }],
    realWorldExamples: [{
      title: String,
      description: String,
      code: String,
      language: String,
      explanation: String,
      visualSuggestion: String
    }],
    inlineVisuals: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    keyPoints: [{
      type: String,
      trim: true
    }],
    summary: {
      type: String
    }
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isContentGenerated: {
    type: Boolean,
    default: false
  },
  contentGeneratedAt: {
    type: Date
  },
  aiGenerationPrompt: {
    type: String
  },
  status: {
    type: String,
    enum: ['locked', 'available', 'in_progress', 'completed'],
    default: 'locked'
  },
  userProgress: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    timeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    completedAt: Date,
    lastAccessedAt: Date,
    notes: String
  }],
  quiz: {
    questions: [{
      question: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'short_answer', 'code'],
        required: true
      },
      options: [String], // for multiple choice
      correctAnswer: {
        type: String,
        required: true
      },
      explanation: String,
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
      }
    }],
    passingScore: {
      type: Number,
      default: 70
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Get user progress for a specific user
topicSchema.methods.getUserProgress = function(userId) {
  return this.userProgress.find(progress => 
    progress.userId.toString() === userId.toString()
  );
};

// Update user progress
topicSchema.methods.updateUserProgress = function(userId, updateData) {
  const existingProgress = this.getUserProgress(userId);
  
  if (existingProgress) {
    Object.assign(existingProgress, updateData);
  } else {
    this.userProgress.push({
      userId,
      ...updateData
    });
  }
  
  return this.save();
};

export default mongoose.model('Topic', topicSchema);