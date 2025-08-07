import React, { useState } from 'react';
import { useLearning } from '../../contexts/LearningContext';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
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
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  // User preferences state
  const [skillLevel, setSkillLevel] = useState(user?.preferences?.skillLevel || 'beginner');
  const [learningAge, setLearningAge] = useState(user?.preferences?.learningAge || 'adult');
  const [tutorPersonality, setTutorPersonality] = useState(user?.preferences?.tutorPersonality || 'friendly');
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
    { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and motivating', icon: '🎉' },
    { value: 'patient', label: 'Patient', description: 'Calm and understanding', icon: '🧘' },
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

  const handleSkillLevelChange = (level: string) => {
    console.log('Changing skill level to:', level);
    setSkillLevel(level);
  };

  const handleLearningAgeChange = (age: string) => {
    console.log('Changing learning age to:', age);
    setLearningAge(age);
  };

  const handleTutorPersonalityChange = (personality: string) => {
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
      setLoading(true);
      setLoadingMessage('🤖 Connecting to AI service...');
      
      // Add a timeout to update the loading message
      const messageTimeout = setTimeout(() => {
        setLoadingMessage('🧠 AI is generating your comprehensive learning path...');
      }, 3000);
      
      const messageTimeout2 = setTimeout(() => {
        setLoadingMessage('⏳ This may take a few minutes for comprehensive content...');
      }, 30000);
      
      const messageTimeout3 = setTimeout(() => {
        setLoadingMessage('🔄 Still working... Free AI models can be slower during peak times...');
      }, 90000);
      
      try {
        const { learningPath } = await apiService.createLearningPath({
          subject: subject.trim(),
          preferences: { 
            batchSize,
            skillLevel,
            learningAge,
            tutorPersonality,
            learningFormat
          }
        });
        
        // Clear timeouts
        clearTimeout(messageTimeout);
        clearTimeout(messageTimeout2);
        clearTimeout(messageTimeout3);
        
        setLoadingMessage('✅ Learning path created successfully!');
      } catch (apiError) {
        // Clear timeouts
        clearTimeout(messageTimeout);
        clearTimeout(messageTimeout2);
        clearTimeout(messageTimeout3);
        throw apiError;
      }

      addLearningPath(learningPath);
      toast.success(`🎉 Created comprehensive learning path: "${learningPath.title}"`);
      
      if (onPathCreated) {
        onPathCreated(learningPath);
      }
      
      // Reset form
      setSubject('');
      setBatchSize('initial');
      setSkillLevel(user?.preferences?.skillLevel || 'beginner');
      setLearningAge(user?.preferences?.learningAge || 'adult');
      setTutorPersonality(user?.preferences?.tutorPersonality || 'friendly');
      setLearningFormat(user?.preferences?.learningFormat || ['text', 'examples']);
      
    } catch (error: any) {
      console.error('Failed to create learning path:', error);
      
      let errorMessage = 'Failed to create learning path';
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = '⏱️ Generation timed out. The AI is taking longer than expected due to high demand. Please try again in a few minutes or use a simpler subject name.';
      } else if (error.response?.status === 429) {
        errorMessage = '🚫 Rate limit reached. The free AI model has reached its usage limit. Please try again in a few hours.';
      } else if (error.response?.status >= 500) {
        errorMessage = '🔧 Server error. The AI service is temporarily unavailable. Please try again later.';
      } else {
        errorMessage = error.response?.data?.message || error.message || 'Failed to create learning path';
      }
      
      toast.error(errorMessage, {
        duration: 6000, // Show error longer for timeout messages
      });
    } finally {
      setLoading(false);
      setLoadingMessage('');
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
              className="text-muted-foreground hover:text-foreground"
            >
              ×
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
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              💡 Tip: Use simple, specific subjects (e.g., "Python" instead of "Advanced Python Web Development with Django and PostgreSQL") for faster generation
            </p>
          </div>

          {/* Skill Level */}
          <div>
            <label className="block text-sm font-medium mb-3">
              <User className="inline h-4 w-4 mr-2" />
              Skill Level
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {skillLevelOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => !loading && handleSkillLevelChange(option.value)}
                  className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all ${
                    skillLevel === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-blue-400 bg-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Age */}
          <div>
            <label className="block text-sm font-medium mb-3">
              <Target className="inline h-4 w-4 mr-2" />
              Learning Age Group
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {learningAgeOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => !loading && handleLearningAgeChange(option.value)}
                  className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all ${
                    learningAge === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-blue-400 bg-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tutor Personality */}
          <div>
            <label className="block text-sm font-medium mb-3">
              <Heart className="inline h-4 w-4 mr-2" />
              Tutor Personality
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tutorPersonalityOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => !loading && handleTutorPersonalityChange(option.value)}
                  className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all ${
                    tutorPersonality === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-blue-400 bg-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Format */}
          <div>
            <label className="block text-sm font-medium mb-3">
              <Eye className="inline h-4 w-4 mr-2" />
              Preferred Learning Formats (Select multiple)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {learningFormatOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => !loading && handleLearningFormatToggle(option.value)}
                  className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all ${
                    learningFormat.includes(option.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-blue-400 bg-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{option.icon}</span>
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </div>
              ))}
            </div>
            {learningFormat.length === 0 && (
              <p className="text-sm text-red-600 mt-2">Please select at least one learning format</p>
            )}
          </div>

          {/* Batch Size Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Learning Path Scope
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batchOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      batchSize === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400 bg-white'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !loading && handleBatchSizeChange(option.value)}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${
                        batchSize === option.value ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`font-medium ${
                            batchSize === option.value ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {option.label}
                          </h4>
                          {option.recommended && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Recommended</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {option.description}
                        </p>
                        <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{option.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Radio button indicator */}
                    <div className={`absolute top-4 right-4 w-4 h-4 rounded-full border-2 ${
                      batchSize === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400'
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

          {/* Debug Info - Remove in production */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
            <strong>Debug Info:</strong>
            <div>Skill Level: {skillLevel}</div>
            <div>Learning Age: {learningAge}</div>
            <div>Tutor Personality: {tutorPersonality}</div>
            <div>Learning Format: {learningFormat.join(', ')}</div>
            <div>Batch Size: {batchSize}</div>
            <div>Subject: {subject}</div>
          </div>

          {/* Features Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span>Enhanced Features</span>
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Comprehensive topic content with detailed explanations</li>
              <li>• 5-8 code examples per topic with real-world applications</li>
              <li>• 5-7 quiz questions testing deep understanding</li>
              <li>• Load more modules and topics on-demand</li>
              <li>• Progressive difficulty and logical learning flow</li>
            </ul>
          </div>

          {/* Loading Message */}
          {loading && loadingMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <LoadingSpinner size="sm" />
                <span className="text-blue-800 font-medium">{loadingMessage}</span>
              </div>
              <div className="mt-2 text-sm text-blue-600">
                {loadingMessage.includes('peak times') 
                  ? 'Free AI models may experience delays during high usage periods. Thank you for your patience!'
                  : 'Please keep this tab open while we generate your personalized learning content.'
                }
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {loading ? (
                'Generating your personalized learning path...'
              ) : (
                batchSize === 'initial' 
                  ? 'Creates 8-10 modules with substantial content'
                  : 'Creates 12-15 modules with comprehensive coverage'
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !subject.trim() || learningFormat.length === 0}
              className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all ${
                loading || !subject.trim() || learningFormat.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Learning Path</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedLearningPathCreator;