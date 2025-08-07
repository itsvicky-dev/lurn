import mongoose from 'mongoose';

const learningPathSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
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
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  estimatedDuration: {
    type: Number, // in hours
    required: true
  },
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  learningObjectives: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isGenerated: {
    type: Boolean,
    default: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    completedModules: {
      type: Number,
      default: 0
    },
    totalModules: {
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
    }
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'paused'],
    default: 'not_started'
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

// Update progress when modules change
learningPathSchema.methods.updateProgress = function() {
  this.progress.totalModules = this.modules.length;
  this.progress.percentageComplete = this.progress.totalModules > 0 
    ? Math.round((this.progress.completedModules / this.progress.totalModules) * 100)
    : 0;
  
  if (this.progress.percentageComplete === 100) {
    this.status = 'completed';
  } else if (this.progress.percentageComplete > 0) {
    this.status = 'in_progress';
  }
  
  return this.save();
};

export default mongoose.model('LearningPath', learningPathSchema);