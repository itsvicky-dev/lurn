import React, { useState } from 'react';
import { useLearning } from '../../contexts/LearningContext';
import { useAuth } from '../../contexts/AuthContext';
import { backgroundTaskService } from '../../services/backgroundTaskService';
import { notificationService } from '../../services/notificationService';
import apiService from '../../services/api';

import toast from 'react-hot-toast';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Zap,
  Layers,
  Plus,
  User,
  Brain,
  Heart,
  Eye
} from 'lucide-react';

interface EnhancedLearningPathCreatorProps {
  onPathCreated?: (path: any) => void;
  onClose?: () => void;
}

const EnhancedLearningPathCreator: React.FC<EnhancedLearningPathCreatorProps> = ({
  onPathCreated,
  onClose
}) => {
  const { addLearningPath } = useLearning();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [batchSize, setBatchSize] = useState<'initial' | 'extended'>('initial');
  
  // User preferences state
  const [skillLevel, setSkillLevel] = useState(user?.preferences?.skillLevel || 'beginner');
  const [learningAge, setLearningAge] = useState(user?.preferences?.learningAge || 'adult');
  const [tutorPersonality, setTutorPersonality] = useState<'friendly' | 'strict' | 'funny' | 'professional' | 'encouraging'>(user?.preferences?.tutorPersonality || 'friendly');
  const [learningFormat, setLearningFormat] = useState<string[]>(user?.preferences?.learningFormat || ['text', 'examples']);

  const batchOptions = [
    {
      value: 'initial' as const,
      label: 'Standard Path',
      description: '8-10 modules with 8-12 topics each',
      icon: BookOpen,
      estimatedTime: '2-3 minutes',
      recommended: true
    },
    {
      value: 'extended' as const,
      label: 'Comprehensive Path',
      description: '12-15 modules with 10-14 topics each',
      icon: Layers,
      estimatedTime: '3-5 minutes',
      recommended: false
    }
  ];

  const skillLevelOptions = [
    { value: 'beginner', label: 'Beginner', description: 'New to the subject', icon: '🌱' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience', icon: '🌿' },
    { value: 'advanced', label: 'Advanced', description: 'Experienced learner', icon: '🌳' }
  ];

  const learningAgeOptions = [
    { value: 'child', label: 'Child (6-12)', description: 'Simple, fun explanations', icon: '🧒' },
    { value: 'teen', label: 'Teen (13-17)', description: 'Engaging, practical content', icon: '👦' },
    { value: 'adult', label: 'Adult (18-54)', description: 'Professional, detailed content', icon: '👨‍💼' },
    { value: 'senior', label: 'Senior (55+)', description: 'Clear, patient explanations', icon: '👴' }
  ];

  const tutorPersonalityOptions = [
    { value: 'friendly', label: 'Friendly', description: 'Warm and encouraging', icon: '😊' },
    { value: 'professional', label: 'Professional', description: 'Direct and efficient', icon: '👔' },
    { value: 'encouraging', label: 'Encouraging', description: 'Energetic and motivating', icon: '🎉' },
    { value: 'strict', label: 'Strict', description: 'Disciplined and focused', icon: '📏' },
    { value: 'funny', label: 'Funny', description: 'Humorous and entertaining', icon: '😄' }
  ];

  const learningFormatOptions = [
    { value: 'text', label: 'Text', description: 'Written explanations', icon: '📝' },
    { value: 'examples', label: 'Examples', description: 'Code examples', icon: '💻' },
    { value: 'visuals', label: 'Visuals', description: 'Diagrams and images', icon: '🎨' },
    { value: 'videos', label: 'Videos', description: 'Video content', icon: '🎥' },
    { value: 'interactive', label: 'Interactive', description: 'Hands-on exercises', icon: '🎮' },
    { value: 'quizzes', label: 'Quizzes', description: 'Practice questions', icon: '❓' }
  ];

  const handleLearningFormatToggle = (format: string) => {
    console.log('Toggling learning format:', format);
    setLearningFormat(prev => {
      const newFormat = prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format];
      console.log('New learning format:', newFormat);
      return newFormat;
    });
  };

  const handleSkillLevelChange = (level: 'beginner' | 'intermediate' | 'advanced' | 'expert') => {
    console.log('Changing skill level to:', level);
    setSkillLevel(level);
  };

  const handleLearningAgeChange = (age: 'child' | 'teenager' | 'adult' | 'senior') => {
    console.log('Changing learning age to:', age);
    setLearningAge(age);
  };

  const handleTutorPersonalityChange = (personality: 'friendly' | 'strict' | 'funny' | 'professional' | 'encouraging') => {
    console.log('Changing tutor personality to:', personality);
    setTutorPersonality(personality);
  };

  const handleBatchSizeChange = (size: 'initial' | 'extended') => {
    console.log('Changing batch size to:', size);
    setBatchSize(size);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (learningFormat.length === 0) {
      toast.error('Please select at least one learning format');
      return;
    }

    try {
      // Request notification permission
      await notificationService.requestPermission();
      
      // Prepare preferences for background task
      const preferences = { 
        batchSize,
        skillLevel,
        learningAge,
        tutorPersonality,
        learningFormat
      };
      
      // Start background learning path creation
      await backgroundTaskService.createLearningPathInBackground(
        subject.trim(),
        preferences,
        'enhanced'
      );
      
      toast.success('🚀 Enhanced learning path creation started! We\'ll notify you when it\'s ready.');
      
      // Reset form
      setSubject('');
      setBatchSize('initial');
      setSkillLevel(user?.preferences?.skillLevel || 'beginner');
      setLearningAge(user?.preferences?.learningAge || 'adult');
      setTutorPersonality(user?.preferences?.tutorPersonality || 'friendly');
      setLearningFormat(user?.preferences?.learningFormat || ['text', 'examples']);
      
      // Close the modal if callback is provided
      if (onClose) {
        onClose();
      }
      
    } catch (error: any) {
      console.error('Failed to start background learning path creation:', error);
      toast.error('Failed to start learning path creation. Please try again.');
      
      // Close the modal even on error since the user can try again from the main page
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="card-title">Create Enhanced Learning Path</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Generate comprehensive learning paths with 8-15 modules, 8-14 topics per module, and extensive content for deep learning
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="card-content">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject Input */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
              Subject or Topic
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Python, React, Machine Learning..."
              className="input w-full"

              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              💡 Tip: Use simple, specific subjects (e.g., "Python" instead of "Advanced Python Web Development with Django and PostgreSQL") for faster generation
            </p>
          </div>

          {/* Skill Level */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              <User className="inline h-4 w-4 mr-2" />
              Skill Level
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {skillLevelOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSkillLevelChange(option.value as 'beginner' | 'intermediate' | 'advanced' | 'expert')}
                  className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all duration-300 ${
                    skillLevel === option.value
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/25 ring-2 ring-primary/30 transform scale-[1.02]'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-accent hover:shadow-md hover:transform hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{option.icon}</span>
                    <span className={`font-medium ${
                      skillLevel === option.value ? 'text-primary' : 'text-foreground'
                    }`}>{option.label}</span>
                  </div>
                  <p className={`text-xs ${
                    skillLevel === option.value ? 'text-primary/80' : 'text-muted-foreground'
                  }`}>{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Age */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              <Target className="inline h-4 w-4 mr-2" />
              Learning Age Group
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {learningAgeOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleLearningAgeChange(option.value as 'child' | 'teenager' | 'adult' | 'senior')}
                  className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all duration-300 ${
                    learningAge === option.value
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/25 ring-2 ring-primary/30 transform scale-[1.02]'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-accent hover:shadow-md hover:transform hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{option.icon}</span>
                    <span className={`font-medium ${
                      learningAge === option.value ? 'text-primary' : 'text-foreground'
                    }`}>{option.label}</span>
                  </div>
                  <p className={`text-xs ${
                    learningAge === option.value ? 'text-primary/80' : 'text-muted-foreground'
                  }`}>{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tutor Personality */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              <Heart className="inline h-4 w-4 mr-2" />
              Tutor Personality
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tutorPersonalityOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleTutorPersonalityChange(option.value as 'friendly' | 'strict' | 'funny' | 'professional' | 'encouraging')}
                  className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all duration-300 ${
                    tutorPersonality === option.value
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/25 ring-2 ring-primary/30 transform scale-[1.02]'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-accent hover:shadow-md hover:transform hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{option.icon}</span>
                    <span className={`font-medium ${
                      tutorPersonality === option.value ? 'text-primary' : 'text-foreground'
                    }`}>{option.label}</span>
                  </div>
                  <p className={`text-xs ${
                    tutorPersonality === option.value ? 'text-primary/80' : 'text-muted-foreground'
                  }`}>{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Format */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              <Eye className="inline h-4 w-4 mr-2" />
              Preferred Learning Formats (Select multiple)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {learningFormatOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleLearningFormatToggle(option.value)}
                  className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all duration-300 ${
                    learningFormat.includes(option.value)
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/25 ring-2 ring-primary/30 transform scale-[1.02]'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-accent hover:shadow-md hover:transform hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{option.icon}</span>
                    <span className={`font-medium text-sm ${
                      learningFormat.includes(option.value) ? 'text-primary' : 'text-foreground'
                    }`}>{option.label}</span>
                  </div>
                  <p className={`text-xs ${
                    learningFormat.includes(option.value) ? 'text-primary/80' : 'text-muted-foreground'
                  }`}>{option.description}</p>
                </div>
              ))}
            </div>
            {learningFormat.length === 0 && (
              <p className="text-sm text-destructive mt-2">Please select at least one learning format</p>
            )}
          </div>

          {/* Batch Size Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Learning Path Scope
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batchOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-300 ${
                      batchSize === option.value
                        ? 'border-primary bg-primary/20 shadow-lg shadow-primary/25 ring-2 ring-primary/30 transform scale-[1.02]'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-accent hover:shadow-md hover:transform hover:scale-[1.01]'
                    }`}
                    onClick={() => handleBatchSizeChange(option.value)}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${
                        batchSize === option.value ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`font-medium ${
                            batchSize === option.value ? 'text-primary' : 'text-foreground'
                          }`}>
                            {option.label}
                          </h4>
                          {option.recommended && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Recommended</span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${
                          batchSize === option.value ? 'text-primary/80' : 'text-muted-foreground'
                        }`}>
                          {option.description}
                        </p>
                        <div className={`flex items-center space-x-1 mt-2 text-xs ${
                          batchSize === option.value ? 'text-primary/70' : 'text-muted-foreground'
                        }`}>
                          <Clock className="h-3 w-3" />
                          <span>{option.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Radio button indicator */}
                    <div className={`absolute top-4 right-4 w-4 h-4 rounded-full border-2 ${
                      batchSize === option.value
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}>
                      {batchSize === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features Info */}
          <div className="bg-accent/30 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2 flex items-center space-x-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Enhanced Features</span>
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Comprehensive topic content with detailed explanations</li>
              <li>• 5-8 code examples per topic with real-world applications</li>
              <li>• 5-7 quiz questions testing deep understanding</li>
              <li>• Load more modules and topics on-demand</li>
              <li>• Progressive difficulty and logical learning flow</li>
            </ul>
          </div>

          {/* Background Processing Info */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <div>
                <h4 className="font-medium text-primary">Background Processing Enabled</h4>
                <p className="text-sm text-primary/80">
                  Your enhanced learning path will be created in the background. Continue using the app and we'll notify you when it's ready!
                </p>
              </div>
            </div>
          </div>



          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground max-w-md">
              {batchSize === 'initial' 
                ? 'Creates 8-10 modules with substantial content'
                : 'Creates 12-15 modules with comprehensive coverage'
              }
            </div>
            <div className="flex items-center space-x-3">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-outline btn-md px-6 py-2 h-10 min-w-[100px]"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!subject.trim() || learningFormat.length === 0}
                className="btn-primary btn-md flex items-center space-x-2 px-6 py-2 h-10 min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                <span>Queue Creation</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedLearningPathCreator;