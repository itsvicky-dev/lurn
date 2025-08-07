import React, { useState } from 'react';
import { useLearning } from '../../contexts/LearningContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import EnhancedLoadingSpinner from '../ui/EnhancedLoadingSpinner';
import { backgroundTaskService } from '../../services/backgroundTaskService';
import { notificationService } from '../../services/notificationService';
import { X, BookOpen, Sparkles, Bell, BellOff, Users, Brain, Smile, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { OnboardingRequest } from '../../types';
import apiService from '../../services/api';

interface CreateLearningPathModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUBJECTS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'C#',
  'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'HTML/CSS', 'SQL',
  'Machine Learning', 'Data Science', 'Web Development', 'Mobile Development',
  'DevOps', 'Cloud Computing', 'Cybersecurity', 'UI/UX Design', 'Blockchain',
  'Game Development', 'Artificial Intelligence', 'Database Design'
];

const LEARNING_AGES = [
  { value: 'child', label: 'Child (6-12)', description: 'Simple explanations with fun examples' },
  { value: 'teenager', label: 'Teenager (13-17)', description: 'Engaging content with practical projects' },
  { value: 'adult', label: 'Adult (18+)', description: 'Professional and comprehensive learning' },
  { value: 'senior', label: 'Senior (55+)', description: 'Patient and detailed explanations' }
];

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'New to programming and technology' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience with basic concepts' },
  { value: 'advanced', label: 'Advanced', description: 'Comfortable with complex topics' },
  { value: 'expert', label: 'Expert', description: 'Deep knowledge and experience' }
];

const TUTOR_PERSONALITIES = [
  { value: 'friendly', label: 'Friendly', description: 'Warm, encouraging, and supportive' },
  { value: 'professional', label: 'Professional', description: 'Direct, efficient, and focused' },
  { value: 'funny', label: 'Funny', description: 'Humorous and entertaining' },
  { value: 'encouraging', label: 'Encouraging', description: 'Motivational and positive' },
  { value: 'strict', label: 'Strict', description: 'Disciplined and structured' }
];

const LEARNING_FORMATS = [
  { value: 'text', label: 'Text', description: 'Written explanations and articles' },
  { value: 'visuals', label: 'Visuals', description: 'Diagrams and visual representations' },
  { value: 'images', label: 'Images', description: 'Pictures and illustrations' },
  { value: 'charts', label: 'Charts', description: 'Graphs and data visualizations' },
  { value: 'code', label: 'Code Examples', description: 'Practical coding examples' },
  { value: 'videos', label: 'Videos', description: 'Video tutorials and demonstrations' },
  { value: 'audio', label: 'Audio', description: 'Podcasts and audio explanations' }
];

const CreateLearningPathModal: React.FC<CreateLearningPathModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { createLearningPath, refreshLearningPaths } = useLearning();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [useBackground, setUseBackground] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [formData, setFormData] = useState<OnboardingRequest & { 
    customSubject: string; 
    specificGoals: string; 
    estimatedTimePerWeek: number;
    userPreferences: string;
  }>({
    subjects: [],
    customSubject: '',
    learningAge: user?.preferences.learningAge || 'adult',
    skillLevel: user?.preferences.skillLevel || 'beginner',
    tutorPersonality: user?.preferences.tutorPersonality || 'friendly',
    learningFormat: user?.preferences.learningFormat || ['text', 'code'],
    language: 'english',
    estimatedTimePerWeek: 5,
    specificGoals: '',
    userPreferences: ''
  });

  const totalSteps = 5;

  if (!isOpen) return null;

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
      customSubject: ''
    }));
  };

  const handleFormatToggle = (format: string) => {
    setFormData(prev => ({
      ...prev,
      learningFormat: prev.learningFormat.includes(format as any)
        ? prev.learningFormat.filter(f => f !== format)
        : [...prev.learningFormat, format as any]
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate form data
    const subjects = formData.customSubject.trim() 
      ? [...formData.subjects, formData.customSubject.trim()]
      : formData.subjects;
    
    if (subjects.length === 0) {
      toast.error('Please select at least one subject or enter a custom subject');
      return;
    }

    if (formData.learningFormat.length === 0) {
      toast.error('Please select at least one learning format');
      return;
    }

    // Prepare the onboarding request data
    const onboardingData: OnboardingRequest = {
      subjects,
      learningAge: formData.learningAge,
      skillLevel: formData.skillLevel,
      tutorPersonality: formData.tutorPersonality,
      learningFormat: formData.learningFormat,
      language: formData.language || 'english'
    };

    // Add additional preferences if provided
    const additionalPreferences = {
      estimatedTimePerWeek: formData.estimatedTimePerWeek,
      specificGoals: formData.specificGoals,
      userPreferences: formData.userPreferences
    };

    // Check if we should use background processing
    if (useBackground) {
      try {
        const primarySubject = subjects[0];
        const preferences = {
          ...onboardingData,
          ...additionalPreferences,
          subjects: subjects
        };
        
        await backgroundTaskService.createLearningPathInBackground(
          primarySubject, 
          preferences
        );
        onClose();
        toast.success('🚀 Learning path creation started! We\'ll notify you when it\'s ready.');
      } catch (error) {
        console.error('Failed to start background task:', error);
        // Fall back to foreground processing
        setUseBackground(false);
        handleForegroundSubmit(onboardingData, additionalPreferences);
      }
      return;
    }

    // Foreground processing
    handleForegroundSubmit(onboardingData, additionalPreferences);
  };

  const handleForegroundSubmit = async (onboardingData: OnboardingRequest, additionalPreferences: any) => {
    try {
      setLoading(true);
      setLoadingMessage('Generating your personalized learning path...');
      
      // Show notification prompt after 15 seconds
      setTimeout(() => {
        if (loading && !notificationService.isPermissionGranted()) {
          setShowNotificationPrompt(true);
        }
      }, 15000);

      // Get the primary subject for the learning path
      const subjects = formData.customSubject.trim() 
        ? [formData.customSubject.trim()]
        : formData.subjects;
      
      if (subjects.length === 0) {
        toast.error('Please select at least one subject');
        return;
      }
      
      const primarySubject = subjects[0];
      
      // Combine all preferences into a single object
      const preferences = {
        ...onboardingData,
        ...additionalPreferences,
        subjects: subjects // Include all subjects
      };

      // Use the dedicated learning path creation endpoint
      const { learningPath } = await apiService.createLearningPath({
        subject: primarySubject,
        preferences: preferences
      });
      
      // Refresh the learning paths in the context
      await refreshLearningPaths();
      
      onClose();
      toast.success(`Learning path for "${primarySubject}" created successfully!`);
      
    } catch (error: any) {
      console.error('Failed to create learning path:', error);
      
      let errorMessage = 'Failed to create learning path';
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Learning path creation is taking longer than expected. Please try using background processing or try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMessage('');
      setShowNotificationPrompt(false);
    }
  };

  const handleNotificationPermissionRequest = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      toast.success('🔔 Notifications enabled! We\'ll let you know when your content is ready.');
      setShowNotificationPrompt(false);
    } else {
      toast.error('Notifications were not enabled. You can still use the app normally.');
    }
  };

  const handleBackgroundToggle = () => {
    setUseBackground(!useBackground);
    if (!useBackground && !notificationService.isPermissionGranted()) {
      // Request permission when enabling background mode
      notificationService.requestPermission();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.subjects.length > 0 || formData.customSubject.trim().length > 0;
      case 2:
        return formData.learningAge !== '';
      case 3:
        return formData.skillLevel !== '';
      case 4:
        return formData.tutorPersonality !== '';
      case 5:
        return formData.learningFormat.length > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What would you like to learn?
              </h3>
              <p className="text-gray-600">
                Select the subjects you're interested in (you can choose multiple)
              </p>
            </div>

            {/* Popular Subjects */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Popular Subjects
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SUBJECTS.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => handleSubjectToggle(subject)}
                    className={`p-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                      formData.subjects.includes(subject)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter any other subject or course to learn
              </label>
              <input
                type="text"
                value={formData.customSubject}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  customSubject: e.target.value,
                  subjects: [] 
                }))}
                placeholder="e.g., Advanced React Patterns, Docker for Beginners, Quantum Computing..."
                className="input"
              />
            </div>

            {formData.subjects.length > 0 && (
              <div className="text-center text-sm text-gray-600">
                Selected: {formData.subjects.join(', ')}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's your age group?
              </h3>
              <p className="text-gray-600">
                This helps us tailor the content to your level
              </p>
            </div>
            <div className="space-y-3">
              {LEARNING_AGES.map((age) => (
                <button
                  key={age.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, learningAge: age.value as any }))}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    formData.learningAge === age.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{age.label}</div>
                  <div className="text-sm text-gray-600">{age.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Brain className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's your skill level?
              </h3>
              <p className="text-gray-600">
                Be honest - we'll adjust the difficulty accordingly
              </p>
            </div>
            <div className="space-y-3">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, skillLevel: level.value as any }))}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    formData.skillLevel === level.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{level.label}</div>
                  <div className="text-sm text-gray-600">{level.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Smile className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Choose your tutor personality
              </h3>
              <p className="text-gray-600">
                How would you like your AI tutor to interact with you?
              </p>
            </div>
            <div className="space-y-3">
              {TUTOR_PERSONALITIES.map((personality) => (
                <button
                  key={personality.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tutorPersonality: personality.value as any }))}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    formData.tutorPersonality === personality.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{personality.label}</div>
                  <div className="text-sm text-gray-600">{personality.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How do you prefer to learn?
              </h3>
              <p className="text-gray-600">
                Select all formats that work best for you
              </p>
            </div>

            {/* Learning Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Learning Formats
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LEARNING_FORMATS.map((format) => (
                  <button
                    key={format.value}
                    type="button"
                    onClick={() => handleFormatToggle(format.value)}
                    className={`p-4 text-left rounded-lg border-2 transition-colors ${
                      formData.learningFormat.includes(format.value as any)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{format.label}</div>
                    <div className="text-sm text-gray-600">{format.description}</div>
                  </button>
                ))}
              </div>
              {formData.learningFormat.length > 0 && (
                <div className="text-center text-sm text-gray-600 mt-3">
                  Selected: {formData.learningFormat.join(', ')}
                </div>
              )}
            </div>

            {/* Time Commitment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours per week you can dedicate
              </label>
              <input
                type="number"
                min="1"
                max="40"
                value={formData.estimatedTimePerWeek}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  estimatedTimePerWeek: parseInt(e.target.value) || 5 
                }))}
                className="input"
              />
            </div>

            {/* Specific Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specific Goals (Optional)
              </label>
              <textarea
                value={formData.specificGoals}
                onChange={(e) => setFormData(prev => ({ ...prev, specificGoals: e.target.value }))}
                placeholder="What specific skills or projects do you want to work on?"
                rows={3}
                className="textarea"
              />
            </div>

            {/* User Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Preferences (Optional)
              </label>
              <textarea
                value={formData.userPreferences}
                onChange={(e) => setFormData(prev => ({ ...prev, userPreferences: e.target.value }))}
                placeholder="Any specific preferences or requirements for your learning path? (e.g., focus on practical projects, include real-world examples, etc.)"
                rows={4}
                className="textarea"
              />
            </div>

            {/* Background Processing Option */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  {useBackground ? (
                    <Bell className="h-5 w-5 text-blue-600" />
                  ) : (
                    <BellOff className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">Background Processing</h4>
                    <p className="text-sm text-gray-600">
                      Create your learning path in the background and get notified when it's ready
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBackgroundToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useBackground ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useBackground ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {useBackground && (
                <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
                  <p className="text-sm text-green-700">
                    ✨ Your learning path will be created in the background. You can continue using the app and we'll notify you when it's ready!
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Create New Learning Path
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className={currentStep === 1 ? 'font-medium text-primary-600' : ''}>Subject</span>
            <span className={currentStep === 2 ? 'font-medium text-primary-600' : ''}>Age Group</span>
            <span className={currentStep === 3 ? 'font-medium text-primary-600' : ''}>Skill Level</span>
            <span className={currentStep === 4 ? 'font-medium text-primary-600' : ''}>Personality</span>
            <span className={currentStep === 5 ? 'font-medium text-primary-600' : ''}>Preferences</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <EnhancedLoadingSpinner
              type="learning-path"
              title={formData.subjects.join(', ') || formData.customSubject}
              showNotificationPrompt={showNotificationPrompt}
              onNotificationPermissionRequest={handleNotificationPermissionRequest}
            />
          ) : (
            renderStep()
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={() => currentStep === 1 ? onClose() : handlePrevious()}
            className="btn-outline"
            disabled={loading}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>{loading ? 'Creating...' : 'Create Learning Path'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateLearningPathModal;