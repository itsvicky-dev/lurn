import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
  testCaseIndex: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  actualOutput: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  executionTime: {
    type: Number, // in milliseconds
    default: 0
  },
  error: {
    type: String,
    default: null
  }
});

const gameSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingGame',
    required: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'failed', 'abandoned'],
    default: 'in_progress'
  },
  code: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  hintsUsed: {
    type: Number,
    default: 0
  },
  attempts: {
    type: Number,
    default: 0
  },
  testResults: [testResultSchema],
  completedAt: {
    type: Date,
    default: null
  },
  // Quiz-specific fields
  answers: [{
    questionIndex: Number,
    answer: String,
    isCorrect: Boolean,
    timeSpent: Number // in milliseconds
  }],
  quizScore: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Transform _id to id when converting to JSON
gameSessionSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Indexes for better query performance
gameSessionSchema.index({ userId: 1, status: 1 });
gameSessionSchema.index({ gameId: 1, status: 1 });
gameSessionSchema.index({ userId: 1, completedAt: -1 });

// Calculate final score based on various factors
gameSessionSchema.methods.calculateScore = function() {
  const game = this.populated('gameId') || this.gameId;
  if (!game) return 0;

  let baseScore = game.points || 100;
  
  // Reduce score for hints used
  const hintPenalty = this.hintsUsed * 10;
  
  // Reduce score for multiple attempts
  const attemptPenalty = Math.max(0, (this.attempts - 1) * 5);
  
  // Time bonus/penalty (if completed quickly, get bonus)
  const timeBonus = Math.max(0, (game.estimatedTime * 60 - this.timeSpent) / 10);
  
  const finalScore = Math.max(0, baseScore - hintPenalty - attemptPenalty + timeBonus);
  
  this.score = Math.round(finalScore);
  return this.score;
};

const GameSession = mongoose.model('GameSession', gameSessionSchema);

export default GameSession;