import express from 'express';
import Suggestion from '../models/Suggestion.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin, isAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Submit a new suggestion (authenticated users)
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({ 
        message: 'Title and description are required' 
      });
    }

    if (title.length > 200) {
      return res.status(400).json({ 
        message: 'Title must be 200 characters or less' 
      });
    }

    if (description.length > 2000) {
      return res.status(400).json({ 
        message: 'Description must be 2000 characters or less' 
      });
    }

    const suggestion = new Suggestion({
      title: title.trim(),
      description: description.trim(),
      category: category || 'other',
      submittedBy: req.user._id,
      submitterEmail: req.user.email,
      submitterName: `${req.user.firstName} ${req.user.lastName}`,
      tags: tags || []
    });

    await suggestion.save();

    // Populate submitter info for response
    await suggestion.populate('submittedBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Suggestion submitted successfully',
      suggestion
    });
  } catch (error) {
    console.error('Error submitting suggestion:', error);
    res.status(500).json({ 
      message: 'Failed to submit suggestion',
      error: error.message 
    });
  }
});

// Get user's own suggestions (authenticated users)
router.get('/my-suggestions', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const suggestions = await Suggestion.find({ submittedBy: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('submittedBy', 'firstName lastName email');

    const total = await Suggestion.countDocuments({ submittedBy: req.user._id });

    res.json({
      suggestions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching user suggestions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch suggestions',
      error: error.message 
    });
  }
});

// Get all suggestions (admin only)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const category = req.query.category;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    const suggestions = await Suggestion.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('submittedBy', 'firstName lastName email');

    const total = await Suggestion.countDocuments(filter);

    // Get statistics
    const stats = await Suggestion.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Suggestion.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      suggestions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      stats: {
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        byCategory: categoryStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching all suggestions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch suggestions',
      error: error.message 
    });
  }
});

// Update suggestion status (admin only)
router.patch('/admin/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes, priority } = req.body;
    const suggestionId = req.params.id;

    const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'implemented'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status value' 
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (priority) updateData.priority = priority;

    const suggestion = await Suggestion.findByIdAndUpdate(
      suggestionId,
      updateData,
      { new: true, runValidators: true }
    ).populate('submittedBy', 'firstName lastName email');

    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    res.json({
      message: 'Suggestion updated successfully',
      suggestion
    });
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ 
      message: 'Failed to update suggestion',
      error: error.message 
    });
  }
});

// Vote on a suggestion (authenticated users)
router.post('/:id/vote', authenticate, async (req, res) => {
  try {
    const { voteType } = req.body; // 'upvote', 'downvote', or 'remove'
    const suggestionId = req.params.id;

    if (!['upvote', 'downvote', 'remove'].includes(voteType)) {
      return res.status(400).json({ 
        message: 'Invalid vote type. Must be upvote, downvote, or remove' 
      });
    }

    const suggestion = await Suggestion.findById(suggestionId);
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    // Remove existing vote if removing or changing vote
    suggestion.votes.upvotes = suggestion.votes.upvotes.filter(
      vote => vote.user.toString() !== req.user._id.toString()
    );
    suggestion.votes.downvotes = suggestion.votes.downvotes.filter(
      vote => vote.user.toString() !== req.user._id.toString()
    );

    // Add new vote if not removing
    if (voteType === 'upvote') {
      suggestion.votes.upvotes.push({ user: req.user._id });
    } else if (voteType === 'downvote') {
      suggestion.votes.downvotes.push({ user: req.user._id });
    }

    await suggestion.save();

    res.json({
      message: 'Vote recorded successfully',
      voteCount: suggestion.voteCount,
      userVote: suggestion.hasUserVoted(req.user._id)
    });
  } catch (error) {
    console.error('Error voting on suggestion:', error);
    res.status(500).json({ 
      message: 'Failed to record vote',
      error: error.message 
    });
  }
});

// Get public suggestions (for regular users to see popular suggestions)
router.get('/public', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const sortBy = req.query.sortBy || 'createdAt';

    // Build filter - only show approved or implemented suggestions
    const filter = { 
      status: { $in: ['approved', 'implemented'] }
    };
    
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Build sort
    let sort = {};
    if (sortBy === 'popular') {
      // Sort by vote count (this is a simplified approach)
      sort = { createdAt: -1 }; // For now, sort by date. Could be enhanced with vote aggregation
    } else {
      sort[sortBy] = -1;
    }

    const suggestions = await Suggestion.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('submittedBy', 'firstName lastName')
      .select('-adminNotes'); // Don't show admin notes to public

    const total = await Suggestion.countDocuments(filter);

    // Add user vote status to each suggestion
    const suggestionsWithVotes = suggestions.map(suggestion => {
      const suggestionObj = suggestion.toObject();
      suggestionObj.userVote = suggestion.hasUserVoted(req.user._id);
      suggestionObj.voteCount = suggestion.voteCount;
      return suggestionObj;
    });

    res.json({
      suggestions: suggestionsWithVotes,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching public suggestions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch suggestions',
      error: error.message 
    });
  }
});

// Delete suggestion (admin only or suggestion owner)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const suggestionId = req.params.id;
    const suggestion = await Suggestion.findById(suggestionId);

    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    // Check if user is admin or suggestion owner
    const userIsAdmin = isAdmin(req.user.email);
    const isOwner = suggestion.submittedBy.toString() === req.user._id.toString();

    if (!userIsAdmin && !isOwner) {
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own suggestions.' 
      });
    }

    await Suggestion.findByIdAndDelete(suggestionId);

    res.json({ message: 'Suggestion deleted successfully' });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    res.status(500).json({ 
      message: 'Failed to delete suggestion',
      error: error.message 
    });
  }
});

export default router;