import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['feature', 'improvement', 'bug', 'content', 'ui/ux', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'implemented'],
    default: 'pending'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submitterEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  submitterName: {
    type: String,
    required: true,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  votes: {
    upvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    downvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  attachments: [{
    filename: String,
    url: String,
    type: String
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
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

// Index for efficient querying
suggestionSchema.index({ status: 1, createdAt: -1 });
suggestionSchema.index({ submittedBy: 1, createdAt: -1 });
suggestionSchema.index({ category: 1, status: 1 });

// Virtual for vote counts
suggestionSchema.virtual('voteCount').get(function() {
  return {
    upvotes: this.votes.upvotes.length,
    downvotes: this.votes.downvotes.length,
    total: this.votes.upvotes.length - this.votes.downvotes.length
  };
});

// Method to check if user has voted
suggestionSchema.methods.hasUserVoted = function(userId) {
  const upvoted = this.votes.upvotes.some(vote => vote.user.toString() === userId.toString());
  const downvoted = this.votes.downvotes.some(vote => vote.user.toString() === userId.toString());
  
  if (upvoted) return 'upvote';
  if (downvoted) return 'downvote';
  return null;
};

// Method to add vote
suggestionSchema.methods.addVote = function(userId, voteType) {
  // Remove any existing votes from this user
  this.votes.upvotes = this.votes.upvotes.filter(vote => vote.user.toString() !== userId.toString());
  this.votes.downvotes = this.votes.downvotes.filter(vote => vote.user.toString() !== userId.toString());
  
  // Add new vote
  if (voteType === 'upvote') {
    this.votes.upvotes.push({ user: userId });
  } else if (voteType === 'downvote') {
    this.votes.downvotes.push({ user: userId });
  }
  
  return this.save();
};

export default mongoose.model('Suggestion', suggestionSchema);