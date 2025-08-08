import React, { useState } from 'react';
import { useLearning } from '../../contexts/LearningContext';
import { useAuth } from '../../contexts/AuthContext';

import { backgroundTaskService } from '../../services/backgroundTaskService';
import { notificationService } from '../../services/notificationService';
import { X, BookOpen, Sparkles, Bell, Users, Brain, Smile, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { OnboardingRequest } from '../../types';

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

  const [currentStep, setCurrentStep] = useState(1);
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

    // Always use background processing for learning path creation
    try {
      const primarySubject = subjects[0];
      const preferences = {
        ...onboardingData,
        ...additionalPreferences,
        subjects: subjects
      };
      
      // Request notification permission
      await notificationService.requestPermission();
      
      await backgroundTaskService.createLearningPathInBackground(
        primarySubject, 
        preferences,
        'manual'
      );
      
      toast.success('🚀 Learning path creation started! We\'ll notify you when it\'s ready.');
      onClose(); // Close modal after successful queuing
      
    } catch (error) {
      console.error('Failed to start background task:', error);
      toast.error('Failed to start learning path creation. Please try again.');
      onClose(); // Close modal even on error since the user can try again from the main page
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
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                What would you like to learn?
              </h3>
              <p className="text-muted-foreground">
                Select the subjects you're interested in (you can choose multiple)
              </p>
            </div>

            {/* Popular Subjects */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Popular Subjects
              </label>
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
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                What's your age group?
              </h3>
              <p className="text-muted-foreground">
                This helps us tailor the content to your level
              </p>
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
              <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                What's your skill level?
              </h3>
              <p className="text-muted-foreground">
                Be honest - we'll adjust the difficulty accordingly
              </p>
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
              <Smile className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Choose your tutor personality
              </h3>
              <p className="text-muted-foreground">
                How would you like your AI tutor to interact with you?
              </p>
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
              <Settings className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                How do you prefer to learn?
              </h3>
              <p className="text-muted-foreground">
                Select all formats that work best for you
              </p>
            </div>

            {/* Learning Format */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Preferred Learning Formats
              </label>
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
                <div className="text-center text-sm text-muted-foreground mt-3">
                  Selected: {formData.learningFormat.join(', ')}
                </div>
              )}
            </div>

            {/* Time Commitment */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
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
              <label className="block text-sm font-medium text-foreground mb-2">
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
              <label className="block text-sm font-medium text-foreground mb-2">
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

            {/* Background Processing Info */}
            <div className="border-t border-border pt-6">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-primary">Background Processing Enabled</h4>
                    <p className="text-sm text-primary/80">
                      Your learning path will be created in the background. You can continue using the app and we'll notify you when it's ready!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Create New Learning Path
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-border">
          <div className="mb-4">
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
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className={currentStep === 1 ? 'font-medium text-primary' : ''}>Subject</span>
            <span className={currentStep === 2 ? 'font-medium text-primary' : ''}>Age Group</span>
            <span className={currentStep === 3 ? 'font-medium text-primary' : ''}>Skill Level</span>
            <span className={currentStep === 4 ? 'font-medium text-primary' : ''}>Personality</span>
            <span className={currentStep === 5 ? 'font-medium text-primary' : ''}>Preferences</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <button
            onClick={() => currentStep === 1 ? onClose() : handlePrevious()}
            className="btn-outline btn-md px-6 py-2 h-10 min-w-[100px]"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary btn-md px-6 py-2 h-10 min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className="btn-primary btn-md flex items-center space-x-2 px-6 py-2 h-10 min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Queue Creation</span>
            </button>
          )}
        </div>
      </div>


    </div>
  );
};

export default CreateLearningPathModal;