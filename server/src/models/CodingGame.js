import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  isHidden: {
    type: Boolean,
    default: false
  }
});

const codingGameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['code_challenge', 'bug_hunt', 'code_completion', 'syntax_puzzle', 'algorithm_race', 'quiz'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  language: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  estimatedTime: {
    type: Number, // in minutes
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  instructions: {
    type: String,
    required: true
  },
  starterCode: {
    type: String,
    default: ''
  },
  solution: {
    type: String,
    required: function() {
      // Solution is required for all game types except quiz
      return this.type !== 'quiz';
    }
  },
  testCases: [testCaseSchema],
  hints: [{
    type: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  prerequisites: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Quiz-specific fields
  questions: [{
    question: String,
    type: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'short_answer', 'code']
    },
    options: [String],
    correctAnswer: String,
    explanation: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    points: Number,
    timeLimit: Number // in seconds
  }],
  timeLimit: {
    type: Number, // total time limit in seconds for quiz
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
codingGameSchema.index({ type: 1, difficulty: 1, language: 1 });
codingGameSchema.index({ category: 1, isActive: 1 });
codingGameSchema.index({ tags: 1 });

// Virtual for unlocked status (can be customized based on user progress)
codingGameSchema.virtual('isUnlocked').get(function() {
  return true; // For now, all games are unlocked
});

codingGameSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const CodingGame = mongoose.model('CodingGame', codingGameSchema);

export default CodingGame;