import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLearning } from '../../contexts/LearningContext';
import type { LearningPath } from '../../types';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Play, 
  CheckCircle,
  Lock,
  Plus,
  Loader2
} from 'lucide-react';

const LearningPathDetailPage: React.FC = () => {
  const { pathId } = useParams<{ pathId: string }>();
  const { setCurrentPath } = useLearning();
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMoreModules, setLoadingMoreModules] = useState(false);

  useEffect(() => {
    const loadLearningPath = async () => {
      if (!pathId) return;
      
      try {
        setLoading(true);
        const { learningPath } = await apiService.getLearningPath(pathId);
        setLearningPath(learningPath);
        setCurrentPath(learningPath);
      } catch (error) {
        console.error('Failed to load learning path:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLearningPath();
  }, [pathId, setCurrentPath]);

  const handleLoadMoreModules = async () => {
    if (!pathId || !learningPath || loadingMoreModules) return;
    
    try {
      setLoadingMoreModules(true);
      const result = await apiService.generateAdditionalModules(pathId, 5);
      
      // Reload the learning path to get updated data
      const { learningPath: updatedPath } = await apiService.getLearningPath(pathId);
      setLearningPath(updatedPath);
      setCurrentPath(updatedPath);
      
      toast.success(`🎉 Generated ${result.modulesAdded} additional modules! Total: ${result.totalModules}`);
    } catch (error: any) {
      console.error('Failed to generate additional modules:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate additional modules';
      toast.error(errorMessage);
    } finally {
      setLoadingMoreModules(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!learningPath) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">Learning path not found</h2>
        <Link to="/learning" className="btn-primary">
          Back to Learning Paths
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{learningPath.title}</h1>
          <p className="text-muted-foreground">{learningPath.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-content p-4 text-center">
            <BookOpen className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{learningPath.modules.length}</div>
            <div className="text-sm text-muted-foreground">Modules</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content p-4 text-center">
            <Clock className="h-8 w-8 text-success-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{learningPath.estimatedDuration}h</div>
            <div className="text-sm text-muted-foreground">Estimated</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content p-4 text-center">
            <Target className="h-8 w-8 text-warning-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{learningPath.progress.percentageComplete}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content p-4 text-center">
            <CheckCircle className="h-8 w-8 text-error-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {learningPath.progress.completedModules}/{learningPath.progress.totalModules}
            </div>
            <div className="text-sm text-muted-foreground">Modules Done</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Overall Progress</h3>
        </div>
        <div className="card-content">
          <div className="progress-bar mb-2">
            <div 
              className="progress-fill"
              style={{ width: `${learningPath.progress.percentageComplete}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {learningPath.progress.completedModules} of {learningPath.progress.totalModules} modules completed
          </p>
        </div>
      </div>

      {/* Modules */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="card-title">Modules</h3>
            <button
              onClick={handleLoadMoreModules}
              disabled={loadingMoreModules}
              className="btn-secondary btn-sm flex items-center space-x-2"
              title="Generate more modules for this learning path"
            >
              {loadingMoreModules ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{loadingMoreModules ? 'Generating...' : 'Load More Modules'}</span>
            </button>
          </div>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            {learningPath.modules.map((module, index) => {
              const isLocked = module.status === 'locked';
              const isCompleted = module.status === 'completed';
              
              return (
                <div
                  key={module.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    isLocked ? 'border-border bg-muted/50' : 'border-border hover:border-primary-300'
                  } transition-colors`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      isCompleted ? 'bg-success-100 text-success-600' :
                      isLocked ? 'bg-gray-100 text-gray-400' :
                      'bg-primary-100 text-primary-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : isLocked ? (
                        <Lock className="h-5 w-5" />
                      ) : (
                        <span className="font-medium">{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={`font-medium ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {module.title}
                      </h4>
                      <p className={`text-sm ${isLocked ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                        {module.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{module.estimatedDuration} min</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <BookOpen className="h-3 w-3" />
                          <span>{module.topics.length} topics</span>
                        </div>
                        {!isLocked && (
                          <div className="progress-bar w-24">
                            <div 
                              className="progress-fill"
                              style={{ width: `${module.progress.percentageComplete}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {isLocked ? (
                      <span className="text-xs text-muted-foreground">Locked</span>
                    ) : (
                      <Link
                        to={`/learning/modules/${module.id}`}
                        className="btn-primary btn-sm flex items-center space-x-1"
                      >
                        <Play className="h-3 w-3" />
                        <span>{isCompleted ? 'Review' : 'Continue'}</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Learning Objectives */}
      {learningPath.learningObjectives.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Learning Objectives</h3>
          </div>
          <div className="card-content">
            <ul className="space-y-2">
              {learningPath.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                  <span className="text-foreground">{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathDetailPage;