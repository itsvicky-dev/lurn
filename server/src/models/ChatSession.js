import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contextType: {
    type: String,
    enum: ['general', 'module', 'topic', 'learning_path'],
    default: 'general'
  },
  contextId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'contextModel'
  },
  contextModel: {
    type: String,
    enum: ['Module', 'Topic', 'LearningPath']
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      model: String,
      tokens: Number,
      responseTime: Number // in milliseconds
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  tutorPersonality: {
    type: String,
    enum: ['friendly', 'strict', 'funny', 'professional', 'encouraging'],
    default: 'friendly'
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

// Update last message timestamp and count
chatSessionSchema.methods.addMessage = function(message) {
  this.messages.push(message);
  this.totalMessages = this.messages.length;
  this.lastMessageAt = new Date();
  return this.save();
};

export default mongoose.model('ChatSession', chatSessionSchema);