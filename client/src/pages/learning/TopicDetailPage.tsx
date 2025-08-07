import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLearning } from '../../contexts/LearningContext';
import { useAuth } from '../../contexts/AuthContext';
import { Topic, QuizResult } from '../../types';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EnhancedLoadingSpinner from '../../components/ui/EnhancedLoadingSpinner';
import TopicLoader from '../../components/ui/TopicLoader';
import { notificationService } from '../../services/notificationService';
import CodePlayground from '../../components/learning/CodePlayground';
import ChatWidget from '../../components/chat/ChatWidget';
import ContentSection from '../../components/learning/ContentSection';
import InlineVisual from '../../components/learning/InlineVisual';
import VisualAidCard from '../../components/learning/VisualAidCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  Play, 
  MessageCircle,
  BookOpen,
  Code,
  Image,
  BarChart3,
  Lightbulb,
  Target,
  Award,
  Video,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const TopicDetailPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { user } = useAuth();
  const { loadTopic, completeTopic } = useLearning();
  const navigate = useNavigate();
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [generatingVisualAids, setGeneratingVisualAids] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    let notificationTimeout: NodeJS.Timeout;
    
    const loadTopicData = async () => {
      if (!topicId) return;
      
      // Don't reload if we already have the topic with the same ID and are initialized
      if (isInitialized && topic && (topic.id === topicId || (topic as any)._id === topicId)) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        setCanRetry(false);
        console.log('Loading topic:', topicId);
        
        // Show notification prompt after 20 seconds if still loading
        notificationTimeout = setTimeout(() => {
          if (!notificationService.isPermissionGranted()) {
            setShowNotificationPrompt(true);
          }
        }, 20000);
        
        const topicData = await loadTopic(topicId, abortController.signal);
        console.log('Topic loaded successfully:', topicData.title);
        
        // Check if component is still mounted
        if (abortController.signal.aborted) return;
        
        setTopic(topicData);
        setShowNotificationPrompt(false);
        setIsInitialized(true);
        
        // Initialize quiz answers array
        if (topicData.quiz?.questions) {
          setQuizAnswers(new Array(topicData.quiz.questions.length).fill(''));
        }
      } catch (error: any) {
        // Don't show error if request was aborted
        if (error.name === 'AbortError' || abortController.signal.aborted) {
          console.log('Topic request was aborted');
          return;
        }
        
        console.error('Failed to load topic:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        const errorMessage = error.response?.data?.message || error.message;
        const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('exceeded');
        const isGenerationError = error.response?.data?.canRetry || isTimeout;
        
        setError(errorMessage);
        setCanRetry(isGenerationError);
        
        if (isTimeout) {
          toast.error('Content generation is taking longer than expected. You can retry or wait for it to complete.');
        } else {
          toast.error(`Failed to load topic: ${errorMessage}`);
        }
        
        setShowNotificationPrompt(false);
        
        // Only navigate away if it's not a generation error that can be retried
        if (!isGenerationError) {
          navigate('/learning');
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    loadTopicData();
    
    // Cleanup function to abort request if component unmounts
    return () => {
      abortController.abort();
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
      }
    };
  }, [topicId]); // Remove dependencies that cause re-renders

  // Retry content generation
  const handleRetry = async () => {
    if (!topicId) return;
    
    try {
      setRetrying(true);
      setError(null);
      toast.loading('Retrying content generation...', { id: 'retry-toast' });
      
      const { topic: updatedTopic } = await apiService.retryTopicGeneration(topicId);
      
      setTopic(updatedTopic);
      setCanRetry(false);
      
      // Initialize quiz answers array
      if (updatedTopic.quiz?.questions) {
        setQuizAnswers(new Array(updatedTopic.quiz.questions.length).fill(''));
      }
      
      toast.success('Content generated successfully!', { id: 'retry-toast' });
    } catch (error: any) {
      console.error('Failed to retry content generation:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      
      if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfter;
        toast.error(`Please wait ${retryAfter} more minutes before retrying`, { id: 'retry-toast' });
      } else {
        toast.error(`Retry failed: ${errorMessage}`, { id: 'retry-toast' });
      }
    } finally {
      setRetrying(false);
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

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000 / 60)); // in minutes
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startTime]);

  const handleCompleteTopic = async () => {
    if (!topic || !user) return;

    try {
      setCompleting(true);
      await completeTopic(topic.id, timeSpent);
      
      // Update local state
      const userProgress = topic.userProgress.find(p => p.userId === user.id);
      if (userProgress) {
        userProgress.status = 'completed';
        userProgress.completedAt = new Date().toISOString();
        userProgress.timeSpent += timeSpent;
      }
      
      setTopic({ ...topic });
    } catch (error) {
      console.error('Failed to complete topic:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (!topic || !topic.quiz) return;

    try {
      const result = await apiService.submitQuiz(topic.id, quizAnswers);
      setQuizResult(result);
      
      if (result.passed) {
        toast.success('Quiz passed! Great job!');
        await handleCompleteTopic();
      } else {
        toast.error('Quiz not passed. Review the material and try again.');
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      toast.error('Failed to submit quiz');
    }
  };

  const getUserProgress = () => {
    if (!topic || !user) return null;
    return topic.userProgress.find(p => p.userId === user.id);
  };

  const isCompleted = () => {
    const progress = getUserProgress();
    return progress?.status === 'completed';
  };

  const handleGenerateVisualAids = async () => {
    if (!topic) return;
    
    // Handle both id and _id for MongoDB compatibility
    const topicId = topic.id || (topic as any)._id;
    console.log('Topic object:', topic);
    console.log('Using topic ID:', topicId);
    
    if (!topicId) {
      toast.error('Topic ID not found');
      return;
    }
    
    try {
      setGeneratingVisualAids(true);
      toast.loading('Generating visual aids...', { id: 'visual-aids' });
      
      const { visualAids, message } = await apiService.generateVisualAids(topicId);
      
      // Update the topic with new visual aids
      setTopic(prevTopic => {
        if (!prevTopic) return prevTopic;
        return {
          ...prevTopic,
          content: {
            ...prevTopic.content,
            visualAids: [...(prevTopic.content?.visualAids || []), ...visualAids]
          }
        };
      });
      
      toast.success(message || 'Visual aids generated successfully!', { id: 'visual-aids' });
    } catch (error: any) {
      console.error('Failed to generate visual aids:', error);
      toast.error(error.response?.data?.message || 'Failed to generate visual aids', { id: 'visual-aids' });
    } finally {
      setGeneratingVisualAids(false);
    }
  };

  if (loading && !topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <EnhancedLoadingSpinner
          title={topicId ? `Topic ${topicId}` : 'Topic Content'}
          type='topics'
          showNotificationPrompt={showNotificationPrompt}
          onNotificationPermissionRequest={handleNotificationPermissionRequest}
        />
      </div>
    );
  }

  // Show error state with retry option
  if (error && !topic) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Failed to Load Topic</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="space-y-3">
              {canRetry && (
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {retrying && <LoadingSpinner size="sm" />}
                  <span>{retrying ? 'Retrying...' : 'Retry Generation'}</span>
                </button>
              )}
              <Link to="/learning" className="btn-outline w-full block text-center">
                Back to Learning Paths
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">Topic not found</h2>
        <Link to="/learning" className="btn-primary">
          Back to Learning Paths
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className={`flex-1 overflow-auto ${showChat ? 'mr-80' : ''}`}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{topic.title}</h1>
                <p className="text-muted-foreground">{topic.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{topic.estimatedDuration} min</span>
              </div>
              
              {isCompleted() ? (
                <div className="flex items-center space-x-2 text-success-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Completed</span>
                </div>
              ) : (
                <button
                  onClick={handleCompleteTopic}
                  disabled={completing}
                  className="btn-primary flex items-center space-x-2"
                >
                  {completing && <LoadingSpinner size="sm" />}
                  <CheckCircle className="h-4 w-4" />
                  <span>Mark Complete</span>
                </button>
              )}
              
              <button
                onClick={() => setShowChat(!showChat)}
                className="btn-outline flex items-center space-x-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>AI Help</span>
              </button>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Learning Objectives */}
            {topic.content?.keyPoints && topic.content.keyPoints.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-primary-600" />
                    <h3 className="card-title">Learning Objectives</h3>
                  </div>
                </div>
                <div className="card-content">
                  <ul className="space-y-2">
                    {topic.content.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                        <span className="text-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Structured Content Sections */}
            {topic.content?.sections && topic.content.sections.length > 0 ? (
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                    <h3 className="card-title">Learning Content</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Structured sections with relevant visuals to enhance your understanding
                  </p>
                </div>
                <div className="card-content">
                  {topic.content.sections.map((section, index) => (
                    <ContentSection
                      key={index}
                      section={section}
                      index={index}
                      inlineVisuals={topic.content?.inlineVisuals?.sections?.[index]}
                    />
                  ))}
                </div>
              </div>
            ) : topic.content?.text && (
              /* Fallback to original text content */
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                    <h3 className="card-title">Content</h3>
                  </div>
                </div>
                <div className="card-content prose max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {topic.content.text}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Code Examples */}
            {topic.content?.codeExamples && topic.content.codeExamples.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-2">
                    <Code className="h-5 w-5 text-primary-600" />
                    <h3 className="card-title">Code Examples</h3>
                  </div>
                </div>
                <div className="card-content space-y-6">
                  {topic.content.codeExamples.map((example, index) => {
                    const inlineVisuals = topic.content?.inlineVisuals?.codeExamples?.[index];
                    const hasVisuals = inlineVisuals && (inlineVisuals.images.length > 0 || inlineVisuals.videos.length > 0);
                    
                    return (
                      <div key={index} className="space-y-3">
                        <div className={`${hasVisuals ? 'lg:flex lg:items-start lg:space-x-6' : ''}`}>
                          <div className={`${hasVisuals ? 'lg:flex-1' : ''}`}>
                            <h4 className="font-medium text-foreground mb-2">
                              Example {index + 1}: {example.explanation}
                            </h4>
                            <CodePlayground
                              initialCode={example.code}
                              initialLanguage={example.language}
                              readOnly={!example.isRunnable}
                              height="300px"
                            />
                          </div>
                          
                          {/* Inline Visual for Code Example */}
                          {hasVisuals && (
                            <div className="mt-4 lg:mt-0 lg:flex-shrink-0">
                              <InlineVisual 
                                visuals={inlineVisuals} 
                                size="md"
                                className=""
                              />
                              <p className="text-xs text-muted-foreground mt-2 text-center">
                                Visual reference for this example
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Visual suggestion hint for debugging */}
                        {example.visualSuggestion && !hasVisuals && process.env.NODE_ENV === 'development' && (
                          <div className="text-xs text-muted-foreground/70 italic">
                            Visual suggestion: {example.visualSuggestion}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interactive Playground */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center space-x-2">
                  <Play className="h-5 w-5 text-primary-600" />
                  <h3 className="card-title">Try It Yourself</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Experiment with the code and see the results in real-time
                </p>
              </div>
              <div className="card-content">
                <CodePlayground
                  initialLanguage="javascript"
                  height="400px"
                />
              </div>
            </div>

            {/* Visual Aids */}
            {topic.content?.visualAids && topic.content.visualAids.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Image className="h-5 w-5 text-primary-600" />
                        <h3 className="card-title">Visual Learning Materials</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Images and videos to help you understand the concepts better
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateVisualAids}
                      disabled={generatingVisualAids}
                      className="btn-outline btn-sm flex items-center space-x-2"
                      title="Generate more visual aids"
                    >
                      {generatingVisualAids && <LoadingSpinner size="sm" />}
                      <Image className="h-4 w-4" />
                      <span>{generatingVisualAids ? 'Generating...' : 'Add More'}</span>
                    </button>
                  </div>
                </div>
                <div className="card-content">
                  {/* Separate Images and Videos */}
                  <div className="space-y-8">
                    {/* Images Section */}
                    {topic.content.visualAids.filter(aid => aid.type === 'image').length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                          <Image className="h-5 w-5 text-primary-600 mr-2" />
                          Visual Examples ({topic.content.visualAids.filter(aid => aid.type === 'image').length})
                        </h4>
                        <div className="space-y-6">
                          {topic.content.visualAids
                            .filter(aid => aid.type === 'image')
                            .map((aid, index) => (
                              <VisualAidCard
                                key={`image-${index}`}
                                aid={aid}
                                index={index}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Videos Section */}
                    {topic.content.visualAids.filter(aid => aid.type === 'video').length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                          <Video className="h-5 w-5 text-red-600 mr-2" />
                          Video Tutorials ({topic.content.visualAids.filter(aid => aid.type === 'video').length})
                        </h4>
                        <div className="space-y-6">
                          {topic.content.visualAids
                            .filter(aid => aid.type === 'video')
                            .map((aid, index) => (
                              <VisualAidCard
                                key={`video-${index}`}
                                aid={aid}
                                index={index}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Other Visual Aids (Charts, Diagrams) */}
                    {topic.content.visualAids.filter(aid => aid.type === 'chart' || aid.type === 'diagram').length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                          <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                          Charts & Diagrams
                        </h4>
                        <div className="space-y-6">
                          {topic.content.visualAids
                            .filter(aid => aid.type === 'chart' || aid.type === 'diagram')
                            .map((aid, index) => (
                              <VisualAidCard
                                key={`chart-${index}`}
                                aid={aid}
                                index={index}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Generate Visual Aids Section - Show when no visual aids exist but user prefers visual content */}
            {(!topic.content?.visualAids || topic.content.visualAids.length === 0) && 
             user?.preferences?.learningFormat && 
             (user.preferences.learningFormat.includes('visuals') || 
              user.preferences.learningFormat.includes('images') || 
              user.preferences.learningFormat.includes('videos')) && (
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-2">
                    <Image className="h-5 w-5 text-primary-600" />
                    <h3 className="card-title">Visual Learning Materials</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enhance your learning with relevant images and videos
                  </p>
                </div>
                <div className="card-content">
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="bg-muted rounded-full p-4">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-2">No visual materials yet</h4>
                        <p className="text-muted-foreground mb-4 max-w-md">
                          We can generate relevant images and videos to help you understand this topic better.
                        </p>
                        <button
                          onClick={handleGenerateVisualAids}
                          disabled={generatingVisualAids}
                          className="btn-primary flex items-center space-x-2"
                        >
                          {generatingVisualAids && <LoadingSpinner size="sm" />}
                          <Image className="h-4 w-4" />
                          <span>{generatingVisualAids ? 'Generating Visual Aids...' : 'Generate Visual Aids'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Real World Examples */}
            {topic.content?.realWorldExamples && topic.content.realWorldExamples.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-primary-600" />
                    <h3 className="card-title">Real-World Applications</h3>
                  </div>
                </div>
                <div className="card-content space-y-4">
                  {topic.content.realWorldExamples.map((example, index) => {
                    const inlineVisuals = topic.content?.inlineVisuals?.realWorldExamples?.[index];
                    const hasVisuals = inlineVisuals && (inlineVisuals.images.length > 0 || inlineVisuals.videos.length > 0);
                    
                    return (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className={`${hasVisuals ? 'lg:flex lg:items-start lg:space-x-4' : ''}`}>
                          <div className={`${hasVisuals ? 'lg:flex-1' : ''}`}>
                            <h4 className="font-medium text-foreground mb-2">{example.title}</h4>
                            <p className="text-muted-foreground mb-3">{example.description}</p>
                            {example.code && (
                              <CodePlayground
                                initialCode={example.code}
                                initialLanguage={example.language || 'javascript'}
                                readOnly
                                height="200px"
                              />
                            )}
                            <p className="text-sm text-muted-foreground mt-2">{example.explanation}</p>
                          </div>
                          
                          {/* Inline Visual for Real World Example */}
                          {hasVisuals && (
                            <div className="mt-4 lg:mt-0 lg:flex-shrink-0">
                              <InlineVisual 
                                visuals={inlineVisuals} 
                                size="sm"
                                className=""
                              />
                              <p className="text-xs text-muted-foreground mt-2 text-center">
                                Real-world visual example
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Visual suggestion hint for debugging */}
                        {example.visualSuggestion && !hasVisuals && process.env.NODE_ENV === 'development' && (
                          <div className="text-xs text-muted-foreground/70 italic mt-2">
                            Visual suggestion: {example.visualSuggestion}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary */}
            {topic.content?.summary && (
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-primary-600" />
                    <h3 className="card-title">Summary</h3>
                  </div>
                </div>
                <div className="card-content">
                  <p className="text-foreground">{topic.content.summary}</p>
                </div>
              </div>
            )}

            {/* Quiz */}
            {topic.quiz && topic.quiz.questions.length > 0 && !isCompleted() && (
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-primary-600" />
                      <h3 className="card-title">Knowledge Check</h3>
                    </div>
                    {!showQuiz && (
                      <button
                        onClick={() => setShowQuiz(true)}
                        className="btn-primary btn-sm"
                      >
                        Take Quiz
                      </button>
                    )}
                  </div>
                </div>
                
                {showQuiz && (
                  <div className="card-content space-y-6">
                    {topic.quiz.questions.map((question, qIndex) => (
                      <div key={qIndex} className="space-y-3">
                        <h4 className="font-medium text-foreground">
                          {qIndex + 1}. {question.question}
                        </h4>
                        
                        {question.type === 'multiple_choice' && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option, oIndex) => (
                              <label key={oIndex} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`question-${qIndex}`}
                                  value={option}
                                  checked={quizAnswers[qIndex] === option}
                                  onChange={(e) => {
                                    const newAnswers = [...quizAnswers];
                                    newAnswers[qIndex] = e.target.value;
                                    setQuizAnswers(newAnswers);
                                  }}
                                  className="text-primary-600"
                                />
                                <span className="text-foreground">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {question.type === 'short_answer' && (
                          <input
                            type="text"
                            value={quizAnswers[qIndex] || ''}
                            onChange={(e) => {
                              const newAnswers = [...quizAnswers];
                              newAnswers[qIndex] = e.target.value;
                              setQuizAnswers(newAnswers);
                            }}
                            className="input"
                            placeholder="Enter your answer..."
                          />
                        )}
                        
                        {quizResult && (
                          <div className={`p-3 rounded-lg ${
                            quizResult.results[qIndex]?.isCorrect 
                              ? 'bg-success-50 border border-success-200' 
                              : 'bg-error-50 border border-error-200'
                          }`}>
                            <p className={`font-medium ${
                              quizResult.results[qIndex]?.isCorrect 
                                ? 'text-success-800' 
                                : 'text-error-800'
                            }`}>
                              {quizResult.results[qIndex]?.isCorrect ? 'Correct!' : 'Incorrect'}
                            </p>
                            {quizResult.results[qIndex]?.explanation && (
                              <p className="text-sm text-gray-600 mt-1">
                                {quizResult.results[qIndex].explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {!quizResult && (
                      <button
                        onClick={handleQuizSubmit}
                        disabled={quizAnswers.some(answer => !answer)}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit Quiz
                      </button>
                    )}
                    
                    {quizResult && (
                      <div className={`p-4 rounded-lg ${
                        quizResult.passed 
                          ? 'bg-success-50 border border-success-200' 
                          : 'bg-error-50 border border-error-200'
                      }`}>
                        <h4 className={`font-medium ${
                          quizResult.passed ? 'text-success-800' : 'text-error-800'
                        }`}>
                          Quiz {quizResult.passed ? 'Passed' : 'Failed'}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Score: {quizResult.score}% ({quizResult.correctAnswers}/{quizResult.totalQuestions} correct)
                        </p>
                        {!quizResult.passed && (
                          <p className="text-sm text-gray-600 mt-2">
                            Review the material and try again to complete this topic.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      {showChat && (
        <ChatWidget
          contextType="topic"
          contextId={topic.id}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default TopicDetailPage;