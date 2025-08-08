import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLearning } from '../../contexts/LearningContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import LearningPathsLoader from '../../components/ui/LearningPathsLoader';
import CreateLearningPathModal from '../../components/learning/CreateLearningPathModal';
import EnhancedLearningPathCreator from '../../components/learning/EnhancedLearningPathCreator';
import CourseCard from '../../components/learning/CourseCard';
import { 
  BookOpen, 
  Plus, 
  Clock, 
  Target, 
  Play, 
  CheckCircle,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { safeFormatDateWithPrefix } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const LearningPathsPage: React.FC = () => {
  const { user } = useAuth();
  const { learningPaths, loading, loadingMessage, generateModules, refreshLearningPaths } = useLearning();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEnhancedCreator, setShowEnhancedCreator] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [generatingModules, setGeneratingModules] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Auto-refresh when component mounts or when user returns to the page
  useEffect(() => {
    let isActive = true;
    let visibilityTimeout: NodeJS.Timeout | null = null;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.isOnboarded && isActive) {
        // Debounce visibility changes to prevent rapid API calls
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
        }
        visibilityTimeout = setTimeout(() => {
          console.log('📱 Page became visible, refreshing learning paths...');
          refreshLearningPaths();
        }, 1000); // Wait 1 second before refreshing
      }
    };

    // Only refresh on mount if we don't already have learning paths
    if (user?.isOnboarded && learningPaths.length === 0) {
      console.log('🚀 Component mounted, loading learning paths...');
      refreshLearningPaths();
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isActive = false;
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.isOnboarded]); // Remove refreshLearningPaths from dependencies to prevent infinite loops

  const filteredPaths = learningPaths.filter(path => {
    const matchesSearch = path.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         path.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || path.status === filterStatus;
    const matchesDifficulty = filterDifficulty === 'all' || path.difficulty === filterDifficulty;
    
    return matchesSearch && matchesStatus && matchesDifficulty;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'in_progress':
        return 'bg-primary-100 text-primary-800';
      case 'paused':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-success-100 text-success-800';
      case 'intermediate':
        return 'bg-warning-100 text-warning-800';
      case 'advanced':
        return 'bg-error-100 text-error-800';
      case 'expert':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateModules = async (courseId: string) => {
    try {
      setGeneratingModules(courseId);
      setGenerationProgress('Generating course modules...');
      
      // Show progress messages
      setTimeout(() => {
        if (generatingModules === courseId) {
          setGenerationProgress('Creating detailed content for each module...');
        }
      }, 15000);
      
      setTimeout(() => {
        if (generatingModules === courseId) {
          setGenerationProgress('Almost done! Finalizing module structure...');
        }
      }, 45000);

      await generateModules(courseId);
      
      toast.success('Course modules generated successfully!');
      setGenerationProgress('');
    } catch (error: any) {
      console.error('Failed to generate modules:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate modules';
      toast.error(errorMessage);
    } finally {
      setGeneratingModules(null);
      setGenerationProgress('');
    }
  };

  const handleModuleClick = (moduleId: string) => {
    if (!moduleId) {
      toast.error('Unable to load module: Invalid module ID');
      return;
    }
    navigate(`/learning/modules/${moduleId}`);
  };

  if (loading) {
    return <LearningPathsLoader message={loadingMessage} />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Learning Paths</h1>
          <p className="text-muted-foreground">
            Manage your personalized learning journeys
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refreshLearningPaths()}
            className="btn-ghost btn-md flex items-center space-x-2 px-3 py-2 h-10"
            title="Refresh learning paths"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-outline btn-md flex items-center space-x-2 px-4 py-2 h-10"
          >
            <Plus className="h-4 w-4" />
            <span>Quick Path</span>
          </button>
          <button
            onClick={() => setShowEnhancedCreator(true)}
            className="btn-primary btn-md flex items-center space-x-2 px-4 py-2 h-10"
          >
            <BookOpen className="h-4 w-4" />
            <span>Enhanced Path</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-content p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search learning paths..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input"
                >
                  <option value="all">All Status</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="input"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Paths Grid */}
      {filteredPaths.length > 0 ? (
        <div className="space-y-6">
          {filteredPaths.map((path) => {
            const pathId = path.id || (path as any)._id;
            return (
              <CourseCard
                key={pathId}
                course={path}
                onModuleClick={handleModuleClick}
                onGenerateModules={handleGenerateModules}
                isGeneratingModules={generatingModules === pathId}
                generationProgress={generatingModules === pathId ? generationProgress : ''}
              />
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="card-content p-12 text-center">
            {learningPaths.length === 0 ? (
              <>
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No learning paths yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first learning path to start your journey with AI Tutor
                </p>
              </>
            ) : (
              <>
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No matching learning paths
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filter criteria
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterDifficulty('all');
                  }}
                  className="btn-outline btn-md px-4 py-2 h-10"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Learning Path Creator */}
      {showEnhancedCreator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <EnhancedLearningPathCreator
              onPathCreated={(path) => {
                setShowEnhancedCreator(false);
                navigate(`/learning/paths/${path.id}`);
              }}
              onClose={() => setShowEnhancedCreator(false)}
            />
          </div>
        </div>
      )}

      {/* Create Learning Path Modal */}
      {showCreateModal && (
        <CreateLearningPathModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default LearningPathsPage;