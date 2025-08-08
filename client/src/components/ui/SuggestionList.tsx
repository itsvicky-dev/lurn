import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Calendar, 
  User, 
  Tag, 
  Trash2,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Lightbulb,
  Bug,
  Palette,
  BookOpen,
  Zap,
  Package
} from 'lucide-react';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { Suggestion } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface SuggestionListProps {
  suggestions: Suggestion[];
  isLoading?: boolean;
  showVoting?: boolean;
  showUserInfo?: boolean;
  showAdminActions?: boolean;
  onVote?: (suggestionId: string, voteType: 'upvote' | 'downvote' | 'remove') => void;
  onDelete?: (suggestionId: string) => void;
  onStatusUpdate?: (suggestionId: string, status: string, adminNotes?: string) => void;
  className?: string;
}

const statusIcons = {
  pending: Clock,
  under_review: AlertCircle,
  approved: CheckCircle,
  rejected: XCircle,
  implemented: CheckCircle
};

const statusColors = {
  pending: 'text-yellow-500',
  under_review: 'text-blue-500',
  approved: 'text-green-500',
  rejected: 'text-red-500',
  implemented: 'text-purple-500'
};

const statusLabels = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  implemented: 'Implemented'
};

const categoryIcons = {
  feature: Lightbulb,
  improvement: Zap,
  bug: Bug,
  content: BookOpen,
  'ui/ux': Palette,
  other: Package
};

const priorityColors = {
  low: 'text-gray-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  critical: 'text-red-500'
};

const SuggestionList: React.FC<SuggestionListProps> = ({
  suggestions,
  isLoading = false,
  showVoting = true,
  showUserInfo = true,
  showAdminActions = false,
  onVote,
  onDelete,
  onStatusUpdate,
  className
}) => {
  const [votingStates, setVotingStates] = useState<Record<string, boolean>>({});
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());

  const handleVote = async (suggestionId: string, voteType: 'upvote' | 'downvote' | 'remove') => {
    if (votingStates[suggestionId]) return;

    setVotingStates(prev => ({ ...prev, [suggestionId]: true }));

    try {
      await apiService.voteSuggestion(suggestionId, voteType);
      onVote?.(suggestionId, voteType);
      toast.success(voteType === 'remove' ? 'Vote removed' : `${voteType === 'upvote' ? 'Upvoted' : 'Downvoted'} suggestion`);
    } catch (error: any) {
      console.error('Error voting on suggestion:', error);
      toast.error(error.response?.data?.message || 'Failed to vote');
    } finally {
      setVotingStates(prev => ({ ...prev, [suggestionId]: false }));
    }
  };

  const handleDelete = async (suggestionId: string) => {
    if (window.confirm('Are you sure you want to delete this suggestion?')) {
      try {
        await apiService.deleteSuggestion(suggestionId);
        onDelete?.(suggestionId);
        toast.success('Suggestion deleted successfully');
      } catch (error: any) {
        console.error('Error deleting suggestion:', error);
        toast.error(error.response?.data?.message || 'Failed to delete suggestion');
      }
    }
  };

  const toggleExpanded = (suggestionId: string) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" text="Loading suggestions..." />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No suggestions found</h3>
        <p className="text-muted-foreground">Be the first to submit a suggestion!</p>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      <AnimatePresence>
        {suggestions.map((suggestion) => {
          const StatusIcon = statusIcons[suggestion.status];
          const CategoryIcon = categoryIcons[suggestion.category];
          const isExpanded = expandedSuggestions.has(suggestion.id);
          const isVoting = votingStates[suggestion.id];

          return (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-primary-500/10 rounded-lg">
                    <CategoryIcon className="h-5 w-5 text-primary-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">{suggestion.title}</h3>
                      <span className={clsx(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                        statusColors[suggestion.status],
                        'bg-current/10'
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {statusLabels[suggestion.status]}
                      </span>
                    </div>
                    
                    {showUserInfo && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {suggestion.submitterName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(suggestion.createdAt).toLocaleDateString()}
                        </div>
                        {showAdminActions && (
                          <div className="flex items-center gap-1">
                            <span className={clsx('font-medium', priorityColors[suggestion.priority])}>
                              {suggestion.priority.toUpperCase()} Priority
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <p className={clsx(
                      'text-muted-foreground leading-relaxed',
                      !isExpanded && suggestion.description.length > 200 && 'line-clamp-3'
                    )}>
                      {isExpanded ? suggestion.description : suggestion.description.slice(0, 200)}
                      {!isExpanded && suggestion.description.length > 200 && '...'}
                    </p>

                    {suggestion.description.length > 200 && (
                      <button
                        onClick={() => toggleExpanded(suggestion.id)}
                        className="text-primary-500 hover:text-primary-600 text-sm font-medium mt-2 transition-colors"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}

                    {/* Tags */}
                    {suggestion.tags && suggestion.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {suggestion.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground"
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Admin Notes */}
                    {showAdminActions && suggestion.adminNotes && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-1">Admin Notes:</p>
                        <p className="text-sm text-muted-foreground">{suggestion.adminNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {showVoting && suggestion.voteCount && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(suggestion.id, suggestion.userVote === 'upvote' ? 'remove' : 'upvote')}
                        disabled={isVoting}
                        className={clsx(
                          'p-2',
                          suggestion.userVote === 'upvote' && 'text-green-500 bg-green-500/10'
                        )}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span className="ml-1 text-xs">{suggestion.voteCount.upvotes}</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(suggestion.id, suggestion.userVote === 'downvote' ? 'remove' : 'downvote')}
                        disabled={isVoting}
                        className={clsx(
                          'p-2',
                          suggestion.userVote === 'downvote' && 'text-red-500 bg-red-500/10'
                        )}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span className="ml-1 text-xs">{suggestion.voteCount.downvotes}</span>
                      </Button>
                    </div>
                  )}

                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(suggestion.id)}
                      className="p-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              {showAdminActions && onStatusUpdate && (
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'under_review', 'approved', 'rejected', 'implemented'].map((status) => (
                      <Button
                        key={status}
                        variant={suggestion.status === status ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => onStatusUpdate(suggestion.id, status)}
                        className="text-xs"
                      >
                        {statusLabels[status as keyof typeof statusLabels]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default SuggestionList;