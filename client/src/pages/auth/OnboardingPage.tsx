import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {type OnboardingRequest } from '../../types';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EnhancedLoadingSpinner from '../../components/ui/EnhancedLoadingSpinner';
import { notificationService } from '../../services/notificationService';
import { BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const SUBJECTS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'C#',
  'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'HTML/CSS', 'SQL',
  'Machine Learning', 'Data Science', 'Web Development', 'Mobile Development',
  'DevOps', 'Cloud Computing', 'Cybersecurity', 'UI/UX Design'
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

const OnboardingPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [formData, setFormData] = useState<OnboardingRequest & { 
    customSubject: string; 
    userPreferences: string; 
  }>({
    subjects: [],
    customSubject: '',
    learningAge: 'adult',
    skillLevel: 'beginner',
    tutorPersonality: 'friendly',
    learningFormat: ['text', 'code'],
    language: 'english',
    userPreferences: ''
  });

  const totalSteps = 5;

  const handleNotificationPermissionRequest = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      toast.success('🔔 Notifications enabled! We\'ll let you know when your content is ready.');
      setShowNotificationPrompt(false);
    } else {
      toast.error('Notifications were not enabled. You can still use the app normally.');
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
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

    try {
      setLoading(true);
      
      // Show notification prompt after 15 seconds
      setTimeout(() => {
        if (loading && !notificationService.isPermissionGranted()) {
          setShowNotificationPrompt(true);
        }
      }, 15000);
      
      // Prepare the onboarding data with custom subject included
      const onboardingData: OnboardingRequest = {
        subjects,
        learningAge: formData.learningAge,
        skillLevel: formData.skillLevel,
        tutorPersonality: formData.tutorPersonality,
        learningFormat: formData.learningFormat,
        language: formData.language
      };

      const { user: updatedUser } = await apiService.completeOnboarding(onboardingData);
      updateUser(updatedUser);
      toast.success('Welcome to AI Tutor! Generating your personalized learning paths...');
      
      // Wait for learning paths to be available, then redirect
      let attempts = 0;
      let learningPaths = [];
      while (attempts < 10) {
        try {
          const res = await apiService.getLearningPaths();
          learningPaths = res.learningPaths || [];
          if (learningPaths.length > 0) break;
        } catch (e) {}
        await new Promise(r => setTimeout(r, 1200));
        attempts++;
      }
      if (learningPaths.length > 0) {
        navigate(`/learning/paths/${learningPaths[0].id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
      setShowNotificationPrompt(false);
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
              <h2 className="text-2xl font-bold text-gray-900">What would you like to learn?</h2>
              <p className="mt-2 text-gray-600">Select the subjects you're interested in (you can choose multiple)</p>
            </div>
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
              <h2 className="text-2xl font-bold text-gray-900">What's your age group?</h2>
              <p className="mt-2 text-gray-600">This helps us tailor the content to your level</p>
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
              <h2 className="text-2xl font-bold text-gray-900">What's your skill level?</h2>
              <p className="mt-2 text-gray-600">Be honest - we'll adjust the difficulty accordingly</p>
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
              <h2 className="text-2xl font-bold text-gray-900">Choose your tutor personality</h2>
              <p className="mt-2 text-gray-600">How would you like your AI tutor to interact with you?</p>
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
              <h2 className="text-2xl font-bold text-gray-900">How do you prefer to learn?</h2>
              <p className="mt-2 text-gray-600">Select all formats that work best for you</p>
            </div>
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
              <div className="text-center text-sm text-gray-600">
                Selected: {formData.learningFormat.join(', ')}
              </div>
            )}

            {/* User Preferences */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Preferences (Optional)
              </label>
              <textarea
                value={formData.userPreferences}
                onChange={(e) => setFormData(prev => ({ ...prev, userPreferences: e.target.value }))}
                placeholder="Any specific preferences or requirements for your learning experience? (e.g., focus on practical projects, include real-world examples, prefer step-by-step tutorials, etc.)"
                rows={4}
                className="textarea"
              />
              <p className="mt-2 text-sm text-gray-500">
                Tell us how you'd like to learn and we'll personalize your experience accordingly.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-10 w-10 text-primary" />
                <h1 className="text-3xl font-bold gradient-text">AI Tutor</h1>
              </div>
            </div>
            <h2 className="text-xl text-muted-foreground">
              Welcome, {user?.firstName}! Setting up your personalized experience...
            </h2>
          </div>

          <div className="card">
            <div className="card-content p-8">
              <EnhancedLoadingSpinner
                type="onboarding"
                title={formData.subjects.join(', ') || formData.customSubject}
                showNotificationPrompt={showNotificationPrompt}
                onNotificationPermissionRequest={handleNotificationPermissionRequest}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-10 w-10 text-primary" />
              <h1 className="text-3xl font-bold gradient-text">AI Tutor</h1>
            </div>
          </div>
          <h2 className="text-xl text-muted-foreground">
            Welcome, {user?.firstName}! Let's personalize your learning experience.
          </h2>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
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

        {/* Step content */}
        <div className="card mb-8">
          <div className="card-content p-8">
            {renderStep()}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="btn-outline btn-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary btn-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="btn-primary btn-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>Complete Setup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;