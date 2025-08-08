import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  Plus, 
  Filter, 
  Search, 
  TrendingUp, 
  Clock, 
  Users,
  Lightbulb,
  MessageSquare
} from 'lucide-react';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SuggestionForm from '../../components/ui/SuggestionForm';
import SuggestionList from '../../components/ui/SuggestionList';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Suggestion, SuggestionsResponse } from '../../types';
import toast from 'react-hot-toast';

type TabType = 'public' | 'my-suggestions' | 'submit';

const SuggestionsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('public');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  
  // Filters
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'feature', label: 'New Features' },
    { value: 'improvement', label: 'Improvements' },
    { value: 'bug', label: 'Bug Reports' },
    { value: 'content', label: 'Content Requests' },
    { value: 'ui/ux', label: 'UI/UX' },
    { value: 'other', label: 'Other' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Most Recent' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'title', label: 'Alphabetical' }
  ];

  const loadSuggestions = async (page = 1) => {
    setIsLoading(true);
    try {
      let response: SuggestionsResponse;
      
      if (activeTab === 'public') {
        response = await apiService.getPublicSuggestions(page, 10, category, sortBy);
      } else if (activeTab === 'my-suggestions') {
        response = await apiService.getMySuggestions(page, 10);
      } else {
        return; // Submit tab doesn't need to load suggestions
      }

      setSuggestions(response.suggestions);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Error loading suggestions:', error);
      toast.error('Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'submit') {
      loadSuggestions();
    }
  }, [activeTab, category, sortBy]);

  const handleVote = async (suggestionId: string, voteType: 'upvote' | 'downvote' | 'remove') => {
    // Optimistically update the UI
    setSuggestions(prev => prev.map(suggestion => {
      if (suggestion.id === suggestionId) {
        const newSuggestion = { ...suggestion };
        
        // Remove existing vote
        if (newSuggestion.votes) {
          newSuggestion.votes.upvotes = newSuggestion.votes.upvotes.filter(
            vote => vote.user !== user?.id
          );
          newSuggestion.votes.downvotes = newSuggestion.votes.downvotes.filter(
            vote => vote.user !== user?.id
          );
        }
        
        // Add new vote if not removing
        if (voteType === 'upvote') {
          newSuggestion.votes?.upvotes.push({ user: user?.id || '', createdAt: new Date().toISOString() });
          newSuggestion.userVote = 'upvote';
        } else if (voteType === 'downvote') {
          newSuggestion.votes?.downvotes.push({ user: user?.id || '', createdAt: new Date().toISOString() });
          newSuggestion.userVote = 'downvote';
        } else {
          newSuggestion.userVote = null;
        }
        
        // Update vote count
        if (newSuggestion.voteCount) {
          newSuggestion.voteCount = {
            upvotes: newSuggestion.votes?.upvotes.length || 0,
            downvotes: newSuggestion.votes?.downvotes.length || 0,
            total: (newSuggestion.votes?.upvotes.length || 0) - (newSuggestion.votes?.downvotes.length || 0)
          };
        }
        
        return newSuggestion;
      }
      return suggestion;
    }));
  };

  const handleDelete = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(suggestion => suggestion.id !== suggestionId));
  };

  const handleSubmitSuccess = () => {
    toast.success('Suggestion submitted successfully!');
    setActiveTab('my-suggestions');
  };

  const handlePageChange = (page: number) => {
    loadSuggestions(page);
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    searchTerm === '' || 
    suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary-500/10 rounded-xl">
              <Lightbulb className="h-8 w-8 text-primary-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Suggestions</h1>
              <p className="text-muted-foreground">Help us improve the AI Tutor platform</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Suggestions</p>
                  <p className="text-xl font-bold text-foreground">{pagination.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Popular This Week</p>
                  <p className="text-xl font-bold text-foreground">
                    {suggestions.filter(s => s.voteCount && s.voteCount.total > 0).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Suggestions</p>
                  <p className="text-xl font-bold text-foreground">
                    {suggestions.filter(s => s.submitterEmail === user?.email).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'public', label: 'Public Suggestions', icon: Users },
            { id: 'my-suggestions', label: 'My Suggestions', icon: Clock },
            { id: 'submit', label: 'Submit New', icon: Plus }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? 'primary' : 'outline'}
              onClick={() => setActiveTab(id as TabType)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Filters (only show for list tabs) */}
        {activeTab !== 'submit' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-4 mb-6"
          >
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search suggestions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'submit' ? (
            <SuggestionForm onSubmitSuccess={handleSubmitSuccess} />
          ) : (
            <>
              <SuggestionList
                suggestions={filteredSuggestions}
                isLoading={isLoading}
                showVoting={activeTab === 'public'}
                showUserInfo={activeTab === 'public'}
                onVote={handleVote}
                onDelete={activeTab === 'my-suggestions' ? handleDelete : undefined}
              />

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.current - 1)}
                    disabled={pagination.current === 1}
                  >
                    Previous
                  </Button>
                  
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    Page {pagination.current} of {pagination.pages}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.current + 1)}
                    disabled={pagination.current === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SuggestionsPage;