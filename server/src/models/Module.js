import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  learningPathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
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
  topics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  prerequisites: [{
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module'
    },
    title: String
  }],
  learningObjectives: [{
    type: String,
    trim: true
  }],
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
  status: {
    type: String,
    enum: ['locked', 'available', 'in_progress', 'completed'],
    default: 'locked'
  },
  progress: {
    completedTopics: {
      type: Number,
      default: 0
    },
    totalTopics: {
      type: Number,
      default: 0
    },
    percentageComplete: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    lastAccessedAt: {
      type: Date
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

// Update progress when topics change
moduleSchema.methods.updateProgress = function() {
  this.progress.totalTopics = this.topics.length;
  this.progress.percentageComplete = this.progress.totalTopics > 0 
    ? Math.round((this.progress.completedTopics / this.progress.totalTopics) * 100)
    : 0;
  
  if (this.progress.percentageComplete === 100) {
    this.status = 'completed';
  } else if (this.progress.percentageComplete > 0) {
    this.status = 'in_progress';
  }
  
  return this.save();
};

export default mongoose.model('Module', moduleSchema);