import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Unlock, 
  CheckCircle, 
  PlayCircle,
  Loader,
  Star
} from 'lucide-react';
import { LearningPath, Module } from '../../types';
import { safeFormatDateWithPrefix } from '../../utils/dateUtils';
import { formatLearningPathDuration } from '../../utils/durationUtils';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useLearning } from '../../contexts/LearningContext';

interface CourseCardProps {
  course: LearningPath;
  onModuleClick: (moduleId: string) => void;
  onGenerateModules: (courseId: string) => void;
  isGeneratingModules?: boolean;
  generationProgress?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onModuleClick,
  onGenerateModules,
  isGeneratingModules = false,
  generationProgress = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { startModule } = useLearning();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30';
      case 'locked':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/30';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'advanced':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
      case 'expert':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };



  const isModuleLocked = (module: Module, index: number) => {
    if (index === 0 && course.modules.length > 0) return false; // First module is always unlocked
    
    // If module explicitly has status 'locked', respect that
    if (module.status === 'locked') return true;
    
    // Check if previous module is completed
    const previousModule = course.modules[index - 1];
    return previousModule && previousModule.status !== 'completed';
  };

  const getModuleIcon = (module: Module, index: number) => {
    if (module.status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    
    if (isModuleLocked(module, index)) {
      return <Lock className="h-5 w-5 text-gray-400" />;
    }
    
    if (module.status === 'in_progress') {
      return <PlayCircle className="h-5 w-5 text-blue-600" />;
    }
    
    return <Unlock className="h-5 w-5 text-gray-600" />;
  };

  const handleModuleClick = async (module: Module, index: number) => {
    const moduleId = module.id || (module as any)._id;
    if (isModuleLocked(module, index)) {
      return; // Don't allow clicking locked modules
    }
    
    // Start the module if it's not already started
    if (module.status === 'available' || module.status === 'locked') {
      try {
        await startModule(moduleId);
      } catch (error) {
        console.error('Failed to start module:', error);
      }
    }
    
    onModuleClick(moduleId);
  };

  const handleGenerateModules = () => {
    if (!isGeneratingModules) {
      const courseId = course.id || (course as any)._id;
      onGenerateModules(courseId);
    }
  };

  return (
    <div className="card">
      {/* Course Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-medium text-primary-600">{course.subject}</span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {course.title}
            </h3>
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {course.description}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
              {course.difficulty?.charAt(0).toUpperCase() + (course.difficulty?.slice(1) || '')}
            </span>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Star className="h-3 w-3" />
              <span>4.8</span>
            </div>
          </div>
        </div>

        {/* Course Stats */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>{course.modules?.length || 0} modules</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatLearningPathDuration(course.estimatedDuration)} total</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span>{course.progress.percentageComplete}% complete</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{course.progress.completedModules}/{course.progress.totalModules} modules</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${course.progress.percentageComplete}%` }}
            />
          </div>
        </div>

        {/* Course Actions */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {safeFormatDateWithPrefix(course.createdAt, course.updatedAt)}
          </div>
          <div className="flex space-x-2">
            {(!course.modules || course.modules.length === 0) && (
              <button
                onClick={handleGenerateModules}
                disabled={isGeneratingModules}
                className="btn-primary btn-sm flex items-center space-x-2"
              >
                {isGeneratingModules ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    <span>Generate Modules</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn-outline btn-sm flex items-center space-x-2"
              disabled={!course.modules || course.modules.length === 0}
            >
              <span>Modules</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generation Progress */}
      {isGeneratingModules && (
        <div className="px-6 py-4 bg-blue-50 dark:bg-blue-950/20 border-t border-blue-100 dark:border-blue-800/30">
          <div className="flex items-center space-x-3">
            <LoadingSpinner size="sm" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Generating course modules...
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {generationProgress || 'This may take 2-3 minutes. We\'ll notify you when ready!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modules List */}
      {isExpanded && course.modules && course.modules.length > 0 && (
        <div className="border-t border-border">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">Course Modules</h4>
            <div className="space-y-3">
              {course.modules.map((module, index) => {
                const locked = isModuleLocked(module, index);
                const moduleId = module.id || (module as any)._id;
                return (
                  <div
                    key={moduleId}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      locked 
                        ? 'bg-muted/50 border-border cursor-not-allowed opacity-60' 
                        : 'bg-card border-border hover:border-primary-300 hover:shadow-sm cursor-pointer'
                    }`}
                    onClick={() => handleModuleClick(module, index)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getModuleIcon(module, index)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className={`font-medium ${locked ? 'text-muted-foreground' : 'text-foreground'}`}>
                            Module {index + 1}: {module.title}
                          </h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(locked ? 'locked' : module.status)}`}>
                            {locked ? 'Locked' : module.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className={`text-sm mb-2 ${locked ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                          {module.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{module.estimatedDuration || 60} min</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="h-3 w-3" />
                            <span>{module.topics?.length || 0} topics</span>
                          </div>
                          {module.progress && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>{module.progress.percentageComplete || 0}% complete</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Module Progress Bar */}
                        {module.progress && !locked && (
                          <div className="mt-2">
                            <div className="w-full bg-secondary rounded-full h-1">
                              <div 
                                className="bg-primary h-1 rounded-full transition-all duration-300"
                                style={{ width: `${module.progress.percentageComplete || 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCard;