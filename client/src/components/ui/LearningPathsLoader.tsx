import React, { useState, useEffect } from 'react';
import { BookOpen, Brain, Target, Sparkles, Zap, Rocket, GraduationCap, Star, TrendingUp } from 'lucide-react';

interface LearningPathsLoaderProps {
  className?: string;
  message?: string;
}

const LearningPathsLoader: React.FC<LearningPathsLoaderProps> = ({ className = '', message }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [showMotivation, setShowMotivation] = useState(false);

  const loadingMessages = [
    "🚀 Launching your learning dashboard...",
    "🧠 Analyzing your learning preferences...",
    "📚 Curating personalized learning paths...",
    "✨ Organizing content by difficulty and topics...",
    "🎯 Tailoring recommendations to your goals...",
    "⚡ Almost ready! Finalizing your experience...",
    "🌟 Preparing something amazing for you...",
  ];

  const motivationalQuotes = [
    { quote: "Every expert was once a beginner.", author: "Robin Sharma" },
    { quote: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
    { quote: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { quote: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  ];

  const icons = [BookOpen, Brain, Target, Sparkles, Zap, Rocket, GraduationCap, Star, TrendingUp];

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 6500);

    const iconInterval = setInterval(() => {
      setCurrentIconIndex((prev) => (prev + 1) % icons.length);
    }, 1800);

    // Show motivational content after 8 seconds
    const motivationTimeout = setTimeout(() => {
      setShowMotivation(true);
    }, 8000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(iconInterval);
      clearTimeout(motivationTimeout);
    };
  }, [loadingMessages.length, icons.length]);

  const CurrentIcon = icons[currentIconIndex];

  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] space-y-8 ${className}`}>
      {/* Animated Icon Container */}
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 w-24 h-24 border-4 border-primary-200 rounded-full animate-spin border-t-primary-600"></div>
        
        {/* Middle pulsing ring */}
        <div className="absolute inset-2 w-20 h-20 border-2 border-primary-300 rounded-full animate-pulse"></div>
        
        {/* Inner icon container */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-500 hover:scale-110">
            <CurrentIcon className="w-6 h-6 text-white animate-bounce" />
          </div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-primary-400 rounded-full animate-ping"></div>
        <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-primary-500 rounded-full animate-ping animation-delay-300"></div>
        <div className="absolute top-1/2 -left-4 w-2 h-2 bg-primary-300 rounded-full animate-ping animation-delay-700"></div>
      </div>

      {/* Progress Bar */}
      <div className="w-80 max-w-sm">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-pulse transform origin-left">
            <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
          </div>
        </div>
      </div>

      {/* Dynamic Loading Message */}
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-gray-800 transition-all duration-500 ease-in-out transform">
          {message || loadingMessages[currentMessageIndex]}
        </h3>
        <p className="text-gray-600 text-sm">
          This might take a few moments while we personalize your experience
        </p>
      </div>

      {/* Animated dots */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce animation-delay-200"></div>
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce animation-delay-400"></div>
      </div>

      {/* Motivational Quote */}
      {showMotivation && (
        <div className="text-center mt-8 p-4 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-lg border border-primary-100 max-w-md animate-in fade-in-0">
          <div className="flex items-center justify-center mb-2">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Daily Inspiration</span>
            <Star className="w-4 h-4 text-yellow-500 ml-1" />
          </div>
          <p className="text-sm text-gray-700 italic mb-2">
            "{motivationalQuotes[currentMessageIndex % motivationalQuotes.length].quote}"
          </p>
          <p className="text-xs text-gray-500">
            - {motivationalQuotes[currentMessageIndex % motivationalQuotes.length].author}
          </p>
        </div>
      )}

      {/* Learning Stats Preview */}
      {/* {showMotivation && (
        <div className="mt-6 grid grid-cols-3 gap-4 max-w-sm mx-auto animate-in fade-in-0">
          <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
            <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">24/7</div>
            <div className="text-xs text-gray-600">Available</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
            <GraduationCap className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">∞</div>
            <div className="text-xs text-gray-600">Subjects</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
            <Brain className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">AI</div>
            <div className="text-xs text-gray-600">Powered</div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default LearningPathsLoader;