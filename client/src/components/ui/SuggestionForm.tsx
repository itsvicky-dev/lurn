import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Send, Lightbulb, Bug, Palette, BookOpen, Zap, Package } from 'lucide-react';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { apiService } from '../../services/api';
import { SuggestionFormData } from '../../types';
import toast from 'react-hot-toast';

interface SuggestionFormProps {
  onSubmitSuccess?: () => void;
  className?: string;
}

const categoryIcons = {
  feature: Lightbulb,
  improvement: Zap,
  bug: Bug,
  content: BookOpen,
  'ui/ux': Palette,
  other: Package
};

const categoryLabels = {
  feature: 'New Feature',
  improvement: 'Improvement',
  bug: 'Bug Report',
  content: 'Content Request',
  'ui/ux': 'UI/UX Enhancement',
  other: 'Other'
};

const categoryDescriptions = {
  feature: 'Suggest a new feature or functionality',
  improvement: 'Suggest improvements to existing features',
  bug: 'Report a bug or issue you encountered',
  content: 'Request new learning content or topics',
  'ui/ux': 'Suggest user interface or experience improvements',
  other: 'Any other suggestions or feedback'
};

const SuggestionForm: React.FC<SuggestionFormProps> = ({ onSubmitSuccess, className }) => {
  const [formData, setFormData] = useState<SuggestionFormData>({
    title: '',
    description: '',
    category: 'other',
    tags: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in both title and description');
      return;
    }

    if (formData.title.length > 200) {
      toast.error('Title must be 200 characters or less');
      return;
    }

    if (formData.description.length > 2000) {
      toast.error('Description must be 2000 characters or less');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiService.submitSuggestion(formData);
      toast.success('Suggestion submitted successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'other',
        tags: []
      });
      setTagInput('');
      
      onSubmitSuccess?.();
    } catch (error: any) {
      console.error('Error submitting suggestion:', error);
      toast.error(error.response?.data?.message || 'Failed to submit suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !formData.tags?.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...(prev.tags || []), tag]
        }));
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('bg-card border border-border rounded-xl p-6 shadow-lg', className)}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-500/10 rounded-lg">
          <Lightbulb className="h-5 w-5 text-primary-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Submit a Suggestion</h2>
          <p className="text-sm text-muted-foreground">Help us improve the AI Tutor platform</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(categoryLabels).map(([value, label]) => {
              const Icon = categoryIcons[value as keyof typeof categoryIcons];
              const isSelected = formData.category === value;
              
              return (
                <motion.button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: value as any }))}
                  className={clsx(
                    'p-3 rounded-lg border-2 transition-all duration-200 text-left',
                    'hover:border-primary-500/50 hover:bg-primary-500/5',
                    isSelected
                      ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      : 'border-border bg-background text-muted-foreground'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{label}</span>
                  </div>
                  <p className="text-xs opacity-75">
                    {categoryDescriptions[value as keyof typeof categoryDescriptions]}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Brief, descriptive title for your suggestion"
            className={clsx(
              'w-full px-4 py-3 rounded-lg border border-border bg-background',
              'text-foreground placeholder-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-colors duration-200'
            )}
            maxLength={200}
            required
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              Be specific and concise
            </p>
            <span className={clsx(
              'text-xs',
              formData.title.length > 180 ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {formData.title.length}/200
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
            Description <span className="text-destructive">*</span>
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Provide detailed information about your suggestion. Include context, use cases, and any relevant details that would help us understand your request better."
            rows={6}
            className={clsx(
              'w-full px-4 py-3 rounded-lg border border-border bg-background',
              'text-foreground placeholder-muted-foreground resize-vertical',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-colors duration-200'
            )}
            maxLength={2000}
            required
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              The more details you provide, the better we can understand your needs
            </p>
            <span className={clsx(
              'text-xs',
              formData.description.length > 1800 ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {formData.description.length}/2000
            </span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-2">
            Tags (Optional)
          </label>
          <input
            type="text"
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add tags to categorize your suggestion (press Enter or comma to add)"
            className={clsx(
              'w-full px-4 py-3 rounded-lg border border-border bg-background',
              'text-foreground placeholder-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-colors duration-200'
            )}
          />
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-md text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive transition-colors"
                  >
                    ×
                  </button>
                </motion.span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Tags help us organize and prioritize suggestions
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default SuggestionForm;