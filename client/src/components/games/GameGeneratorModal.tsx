import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import { 
  X, 
  Wand2, 
  Code, 
  Bug, 
  Puzzle, 
  Target, 
  Timer, 
  HelpCircle,
  Sparkles,
  Settings,
  BookOpen,
  Clock,
  Zap
} from 'lucide-react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface GameGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameGenerated?: (gameId: string) => void;
}

const gameTypeOptions = [
  {
    id: 'code_challenge',
    label: 'Code Challenge',
    icon: Code,
    description: 'Solve programming problems with test cases'
  },
  {
    id: 'bug_hunt',
    label: 'Bug Hunt',
    icon: Bug,
    description: 'Find and fix bugs in existing code'
  },
  {
    id: 'code_completion',
    label: 'Code Completion',
    icon: Puzzle,
    description: 'Complete partially written code'
  },
  {
    id: 'syntax_puzzle',
    label: 'Syntax Puzzle',
    icon: Target,
    description: 'Fix syntax errors and improve code'
  },
  {
    id: 'algorithm_race',
    label: 'Algorithm Race',
    icon: Timer,
    description: 'Implement algorithms efficiently'
  },
  {
    id: 'quiz',
    label: 'Quiz',
    icon: HelpCircle,
    description: 'Answer questions about programming concepts'
  }
];

const difficultyOptions = [
  { id: 'easy', label: 'Easy', color: 'text-green-500', description: 'Perfect for beginners' },
  { id: 'medium', label: 'Medium', color: 'text-yellow-500', description: 'Intermediate level' },
  { id: 'hard', label: 'Hard', color: 'text-red-500', description: 'Advanced challenges' }
];

const languageOptions = [
  'JavaScript',
  'Python',
  'Java',
  'C++',
  'C#',
  'TypeScript',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
  'Swift',
  'Kotlin'
];

const categoryOptions = [
  'Algorithms',
  'Data Structures',
  'Web Development',
  'Object-Oriented Programming',
  'Functional Programming',
  'Database',
  'System Design',
  'Machine Learning',
  'Mobile Development',
  'Game Development',
  'DevOps',
  'Security'
];

const GameGeneratorModal: React.FC<GameGeneratorModalProps> = ({ 
  isOpen, 
  onClose, 
  onGameGenerated 
}) => {
  const { generateGame, loading } = useGame();
  
  const [formData, setFormData] = useState({
    type: '',
    difficulty: '',
    language: '',
    category: '',
    topic: '',
    estimatedTime: 15,
    customRequirements: ''
  });

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGenerate = async () => {
    try {
      // Validate required fields
      if (!formData.type || !formData.difficulty || !formData.language) {
        toast.error('Please fill in all required fields');
        return;
      }

      const game = await generateGame({
        type: formData.type,
        difficulty: formData.difficulty,
        language: formData.language,
        category: formData.category || 'General',
        topic: formData.topic || 'Programming Fundamentals',
        estimatedTime: formData.estimatedTime,
        customRequirements: formData.customRequirements
      });

      if (onGameGenerated && game.id) {
        onGameGenerated(game.id);
      }
      
      onClose();
      
      // Reset form
      setFormData({
        type: '',
        difficulty: '',
        language: '',
        category: '',
        topic: '',
        estimatedTime: 15,
        customRequirements: ''
      });
      setStep(1);
      
    } catch (error) {
      // Error is handled in the context
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.type !== '';
      case 2:
        return formData.difficulty !== '';
      case 3:
        return formData.language !== '';
      case 4:
        return true; // Optional fields
      default:
        return false;
    }
  };

  const getSelectedGameType = () => {
    return gameTypeOptions.find(option => option.id === formData.type);
  };

  const getSelectedDifficulty = () => {
    return difficultyOptions.find(option => option.id === formData.difficulty);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 rounded-lg shadow-md">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display">AI Game Generator</h2>
                <p className="text-muted-foreground">Create custom coding challenges with AI</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-b border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
              <span className="text-sm text-muted-foreground">
                {Math.round((step / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500/90 to-indigo-500/90 h-2 rounded-full shadow-sm"
                initial={{ width: 0 }}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Choose Game Type
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Select the type of coding challenge you want to create
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gameTypeOptions.map((option) => {
                      const IconComponent = option.icon;
                      const isSelected = formData.type === option.id;
                      
                      return (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleInputChange('type', option.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-lg'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{option.label}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Select Difficulty
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Choose the difficulty level for your {getSelectedGameType()?.label.toLowerCase()}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {difficultyOptions.map((option) => {
                      const isSelected = formData.difficulty === option.id;
                      
                      return (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleInputChange('difficulty', option.id)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-lg'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className={`font-semibold text-lg ${option.color}`}>
                                {option.label}
                              </h4>
                              <p className="text-muted-foreground mt-1">
                                {option.description}
                              </p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                            }`} />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center">
                      <Code className="h-5 w-5 mr-2" />
                      Programming Language
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Select the programming language for your {getSelectedDifficulty()?.label.toLowerCase()} {getSelectedGameType()?.label.toLowerCase()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {languageOptions.map((language) => {
                      const isSelected = formData.language === language;
                      
                      return (
                        <motion.button
                          key={language}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleInputChange('language', language)}
                          className={`p-3 rounded-lg border-2 font-medium transition-all ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground shadow-lg'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          {language}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center">
                      <Sparkles className="h-5 w-5 mr-2" />
                      Customize Your Game
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Add optional details to make your game more specific
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Category (Optional)
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a category</option>
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Specific Topic (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.topic}
                        onChange={(e) => handleInputChange('topic', e.target.value)}
                        placeholder="e.g., Binary Search, React Hooks, Sorting Algorithms"
                        className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Estimated Time (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={formData.estimatedTime}
                        onChange={(e) => handleInputChange('estimatedTime', parseInt(e.target.value) || 15)}
                        className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Custom Requirements (Optional)
                      </label>
                      <textarea
                        value={formData.customRequirements}
                        onChange={(e) => handleInputChange('customRequirements', e.target.value)}
                        placeholder="Any specific requirements or constraints for the game..."
                        rows={3}
                        className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-border bg-slate-50 dark:bg-slate-800/30">
            <div className="flex space-x-3">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={loading}
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              {step < totalSteps ? (
                <Button
                  variant="cyber"
                  onClick={handleNext}
                  disabled={!canProceed() || loading}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="cyber"
                  onClick={handleGenerate}
                  disabled={loading}
                  icon={loading ? <LoadingSpinner size="sm" /> : <Zap className="h-4 w-4" />}
                >
                  {loading ? 'Generating...' : 'Generate Game'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameGeneratorModal;