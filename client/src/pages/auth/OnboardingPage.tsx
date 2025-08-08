import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {type OnboardingRequest } from '../../types';
import apiService from '../../services/api';

import { notificationService } from '../../services/notificationService';
import { backgroundTaskService } from '../../services/backgroundTaskService';
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
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    setIsSubmitting(true);

    try {
      // Prepare the onboarding data with custom subject included
      const onboardingData: OnboardingRequest = {
        subjects,
        learningAge: formData.learningAge,
        skillLevel: formData.skillLevel,
        tutorPersonality: formData.tutorPersonality,
        learningFormat: formData.learningFormat,
        language: formData.language
      };

      // Complete onboarding first
      const { user: updatedUser } = await apiService.completeOnboarding(onboardingData);
      updateUser(updatedUser);
      
      // Request notification permission for background tasks (non-blocking)
      notificationService.requestPermission().catch(console.warn);
      
      // Queue learning path creation for each subject (don't wait for completion)
      const queuedTasks = [];
      for (const subject of subjects) {
        try {
          // Queue the task without waiting for it to complete
          backgroundTaskService.createLearningPathInBackground(
            subject, 
            onboardingData,
            'onboarding'
          ).then((taskId) => {
            console.log(`Learning path queued for ${subject} with task ID: ${taskId}`);
          }).catch((error) => {
            console.error(`Failed to create learning path for ${subject}:`, error);
          });
          queuedTasks.push(subject);
        } catch (error) {
          console.error(`Failed to queue background task for ${subject}:`, error);
        }
      }
      
      // Show success messages
      toast.success('🎉 Welcome to Lurn! Your account is set up.');
      
      if (queuedTasks.length > 0) {
        toast(`🚀 ${queuedTasks.length} learning path${queuedTasks.length > 1 ? 's' : ''} queued for creation. You'll be notified when they're ready!`, {
          icon: '📋',
          duration: 5000,
        });
      }
      
      // Navigate to home/dashboard immediately
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.subjects.length > 0 || formData.customSubject.trim().length > 0;
      case 2:
        return formData.learningAge && formData.learningAge.length > 0;
      case 3:
        return formData.skillLevel && formData.skillLevel.length > 0;
      case 4:
        return formData.tutorPersonality && formData.tutorPersonality.length > 0;
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
              <h2 className="text-2xl font-bold text-foreground">What would you like to learn?</h2>
              <p className="mt-2 text-muted-foreground">Select the subjects you're interested in (you can choose multiple)</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SUBJECTS.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => handleSubjectToggle(subject)}
                  className={`p-3 text-sm font-medium rounded-lg border-2 transition-all duration-300 ${
                    formData.subjects.includes(subject)
                      ? 'border-primary bg-primary/20 text-primary shadow-lg shadow-primary/25 ring-2 ring-primary/30'
                      : 'border-border bg-card text-card-foreground hover:border-primary/50 hover:bg-accent hover:shadow-md'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
            
            {/* Custom Subject */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
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
              <div className="text-center text-sm text-muted-foreground">
                Selected: {formData.subjects.join(', ')}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">What's your age group?</h2>
              <p className="mt-2 text-muted-foreground">This helps us tailor the content to your level</p>
            </div>
            <div className="space-y-3">
              {LEARNING_AGES.map((age) => (
                <button
                  key={age.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, learningAge: age.value as any }))}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-300 ${
                    formData.learningAge === age.value
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/25 ring-2 ring-primary/30 transform scale-[1.02]'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-accent hover:shadow-md hover:transform hover:scale-[1.01]'
                  }`}
                >
                  <div className={`font-medium ${
                    formData.learningAge === age.value ? 'text-primary' : 'text-foreground'
                  }`}>{age.label}</div>
                  <div className={`text-sm ${
                    formData.learningAge === age.value ? 'text-primary/80' : 'text-muted-foreground'
                  }`}>{age.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">What's your skill level?</h2>
              <p className="mt-2 text-muted-foreground">Be honest - we'll adjust the difficulty accordingly</p>
            </div>
            <div className="space-y-3">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, skillLevel: level.value as any }))}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-300 ${
                    formData.skillLevel === level.value
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/25 ring-2 ring-primary/30 transform scale-[1.02]'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-accent hover:shadow-md hover:transform hover:scale-[1.01]'
                  }`}
                >
                  <div className={`font-medium ${
                    formData.skillLevel === level.value ? 'text-primary' : 'text-foreground'
                  }`}>{level.label}</div>
                  <div className={`text-sm ${
                    formData.skillLevel === level.value ? 'text-primary/80' : 'text-muted-foreground'
                  }`}>{level.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">Choose your tutor personality</h2>
              <p className="mt-2 text-muted-foreground">How would you like your Lurn to interact with you?</p>
            </div>
            <div className="space-y-3">
              {TUTOR_PERSONALITIES.map((personality) => (
                <button
                  key={personality.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tutorPersonality: personality.value as any }))}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-300 ${
                    formData.tutorPersonality === personality.value
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/25 ring-2 ring-primary/30 transform scale-[1.02]'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-accent hover:shadow-md hover:transform hover:scale-[1.01]'
                  }`}
                >
                  <div className={`font-medium ${
                    formData.tutorPersonality === personality.value ? 'text-primary' : 'text-foreground'
                  }`}>{personality.label}</div>
                  <div className={`text-sm ${
                    formData.tutorPersonality === personality.value ? 'text-primary/80' : 'text-muted-foreground'
                  }`}>{personality.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">How do you prefer to learn?</h2>
              <p className="mt-2 text-muted-foreground">Select all formats that work best for you</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LEARNING_FORMATS.map((format) => (
                <button
                  key={format.value}
                  type="button"
                  onClick={() => handleFormatToggle(format.value)}
                  className={`p-4 text-left rounded-lg border-2 transition-all duration-300 ${
                    formData.learningFormat.includes(format.value as any)
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/25 ring-2 ring-primary/30 transform scale-[1.02]'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-accent hover:shadow-md hover:transform hover:scale-[1.01]'
                  }`}
                >
                  <div className={`font-medium ${
                    formData.learningFormat.includes(format.value as any) ? 'text-primary' : 'text-foreground'
                  }`}>{format.label}</div>
                  <div className={`text-sm ${
                    formData.learningFormat.includes(format.value as any) ? 'text-primary/80' : 'text-muted-foreground'
                  }`}>{format.description}</div>
                </button>
              ))}
            </div>
            {formData.learningFormat.length > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Selected: {formData.learningFormat.join(', ')}
              </div>
            )}

            {/* User Preferences */}
            <div className="border-t border-border pt-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Additional Preferences (Optional)
              </label>
              <textarea
                value={formData.userPreferences}
                onChange={(e) => setFormData(prev => ({ ...prev, userPreferences: e.target.value }))}
                placeholder="Any specific preferences or requirements for your learning experience? (e.g., focus on practical projects, include real-world examples, prefer step-by-step tutorials, etc.)"
                rows={4}
                className="textarea"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Tell us how you'd like to learn and we'll personalize your experience accordingly.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };



  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-10 w-10 text-primary" />
              <h1 className="text-3xl font-bold gradient-text">Lurn</h1>
            </div>
          </div>
          <h2 className="text-xl text-muted-foreground">
            Welcome, {user?.firstName}! Let's personalize your learning experience.
          </h2>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
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
              disabled={!canProceed() || isSubmitting}
              className="btn-primary btn-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Setting up...</span>
                </>
              ) : (
                <span>Complete Setup</span>
              )}
            </button>
          )}
        </div>
      </div>


    </div>
  );
};

export default OnboardingPage;