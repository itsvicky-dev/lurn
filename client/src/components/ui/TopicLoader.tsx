import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Lightbulb, 
  Sparkles, 
  BookOpen, 
  Target, 
  Zap, 
  Code, 
  Rocket,
  Star,
  Coffee,
  Wand2,
  Atom,
  Cpu,
  Palette
} from 'lucide-react';

interface TopicLoaderProps {
  topicId?: string;
  topicTitle?: string;
  showNotificationPrompt?: boolean;
  onNotificationPermissionRequest?: () => void;
  className?: string;
}

const TopicLoader: React.FC<TopicLoaderProps> = ({
  topicId,
  topicTitle,
  showNotificationPrompt = false,
  onNotificationPermissionRequest,
  className = '',
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const loadingMessages = [
    "🤖 AI is brewing some knowledge magic...",
    "🧠 Teaching the AI to teach you better...",
    "💡 Cooking up brilliant explanations...",
    "✨ Sprinkling some learning fairy dust...",
    "📚 Crafting mind-blowing examples...",
    "🎯 Aiming for 'aha!' moments...",
    "⚡ Charging up your brain cells...",
    "🚀 Launching knowledge rockets...",
    "🎨 Painting masterpieces of understanding...",
    "🔥 Igniting your curiosity flames...",
    "🧪 Brewing the perfect learning potion...",
    "🎪 Preparing an educational circus...",
    "💎 Crafting your personal knowledge gem...",
    "🌟 Making learning irresistibly fun...",
    "📖 Writing your personalized textbook...",
    "🎭 Directing an epic learning adventure...",
  ];

  const encouragingMessages = [
    "The AI is having deep thoughts about your topic! 🤔",
    "Connecting the dots for maximum 'aha!' moments! 🔗",
    "Making sure every example is mind-blowing! 🤯",
    "Teaching the AI to be your best teacher! 👨‍🏫",
    "Crafting content that'll make you go 'wow!'! 😲",
    "The AI is reading every book ever written... kidding! 📚",
    "Brewing knowledge like a master chef! 👨‍🍳",
    "Making learning so fun, you'll forget it's educational! 🎪",
    "The AI is consulting with Einstein's ghost! 👻",
    "Turning complex topics into simple magic! 🪄",
    "Your topic is getting the VIP treatment! ⭐",
    "The AI is having a creative breakthrough! 💥",
    "Polishing every word until it sparkles! ✨",
    "Making sure your brain gets the best workout! 💪",
    "The AI is channeling its inner genius! 🧠",
    "Crafting explanations that even your grandma would understand! 👵",
  ];

  const icons = [Brain, Lightbulb, Sparkles, BookOpen, Target, Zap, Code, Rocket, Star, Coffee, Wand2, Atom, Cpu, Palette];

  useEffect(() => {
    // Cycle through messages every 2.5 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 6500);

    // Cycle through icons every 1.8 seconds
    const iconInterval = setInterval(() => {
      setCurrentIconIndex((prev) => (prev + 1) % icons.length);
    }, 5800);

    // Show encouragement after 8 seconds
    const encouragementTimeout = setTimeout(() => {
      setShowEncouragement(true);
    }, 8000);

    // Show stats after 15 seconds
    const statsTimeout = setTimeout(() => {
      setShowStats(true);
    }, 15000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(iconInterval);
      clearTimeout(encouragementTimeout);
      clearTimeout(statsTimeout);
    };
  }, [loadingMessages.length, icons.length]);

  const CurrentIcon = icons[currentIconIndex];

  return (
    <div className={`flex flex-col items-center justify-center min-h-[500px] p-8 bg-background ${className}`}>
      {/* Main Loading Animation */}
      <div className="relative mb-8">
        {/* Outer rotating rings */}
        <div className="absolute inset-0 w-32 h-32 border-4 border-muted rounded-full animate-spin border-t-primary"></div>
        <div className="absolute inset-2 w-28 h-28 border-3 border-muted rounded-full animate-spin border-b-accent animation-delay-300" style={{ animationDirection: 'reverse' }}></div>
        <div className="absolute inset-4 w-24 h-24 border-2 border-muted rounded-full animate-spin border-r-secondary animation-delay-700"></div>
        
        {/* Center icon container */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-500 hover:scale-110 animate-pulse">
            <CurrentIcon className="w-8 h-8 text-primary-foreground animate-bounce" />
          </div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute -top-4 -right-4 w-4 h-4 bg-primary/40 rounded-full animate-ping"></div>
        <div className="absolute -bottom-4 -left-4 w-3 h-3 bg-secondary/40 rounded-full animate-ping animation-delay-500"></div>
        <div className="absolute top-1/2 -left-6 w-2 h-2 bg-accent/40 rounded-full animate-ping animation-delay-1000"></div>
        <div className="absolute top-1/4 -right-6 w-3 h-3 bg-primary/30 rounded-full animate-ping animation-delay-200"></div>
        <div className="absolute bottom-1/4 -left-8 w-2 h-2 bg-secondary/30 rounded-full animate-ping animation-delay-800"></div>
      </div>

      {/* Progress Indicators */}
      <div className="flex justify-center space-x-2 mb-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              index === (currentMessageIndex % 8)
                ? 'bg-gradient-to-r from-primary to-secondary scale-125 shadow-lg' 
                : 'bg-muted scale-100'
            }`}
          />
        ))}
      </div>

      {/* Dynamic Loading Message */}
      <div className="text-center space-y-4 max-w-lg">
        <h2 className="text-2xl font-bold text-foreground transition-all duration-700 ease-in-out transform animate-in fade-in-0">
          {loadingMessages[currentMessageIndex]}
        </h2>

        <p className="text-muted-foreground">
          Creating personalized content just for you...
        </p>
      </div>

      {/* Encouraging Message */}
      {showEncouragement && (
        <div className="mt-6 p-4 bg-card rounded-xl border border-border max-w-md animate-in fade-in-0 slide-in-from-bottom-4">
          <div className="flex items-center justify-center mb-2">
            <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-2" />
            <span className="text-sm font-semibold text-card-foreground uppercase tracking-wide">Fun Fact</span>
            <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400 ml-2" />
          </div>
          <p className="text-card-foreground font-medium text-center">
            {encouragingMessages[currentMessageIndex % encouragingMessages.length]}
          </p>
        </div>
      )}

      {/* Learning Stats */}
      {/* {showStats && (
        <div className="mt-6 grid grid-cols-3 gap-4 max-w-sm animate-in fade-in-0 slide-in-from-bottom-4">
          <div className="text-center p-4 bg-white rounded-xl shadow-lg border border-gray-100 transform hover:scale-105 transition-transform">
            <Brain className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-900">AI</div>
            <div className="text-xs text-gray-600">Powered</div>
          </div>
          <div className="text-center p-4 bg-white rounded-xl shadow-lg border border-gray-100 transform hover:scale-105 transition-transform">
            <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-900">24/7</div>
            <div className="text-xs text-gray-600">Available</div>
          </div>
          <div className="text-center p-4 bg-white rounded-xl shadow-lg border border-gray-100 transform hover:scale-105 transition-transform">
            <Target className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-900">∞</div>
            <div className="text-xs text-gray-600">Topics</div>
          </div>
        </div>
      )} */}

      {/* Notification Prompt */}
      {showNotificationPrompt && onNotificationPermissionRequest && (
        <div className="mt-8 p-4 bg-card rounded-xl border border-border max-w-md animate-in fade-in-0">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <p className="text-card-foreground font-medium">Stay Updated!</p>
          </div>
          <p className="text-muted-foreground text-sm mb-3 text-center">
            We'll notify you when your content is ready so you can continue with other tasks.
          </p>
          <button
            onClick={onNotificationPermissionRequest}
            className="w-full btn-primary btn-sm"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {/* Time Estimate */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-muted rounded-full">
          <Coffee className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-foreground">Usually takes 1-3 minutes</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Premium models are faster and more accurate
        </p>
      </div>

      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float opacity-30"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-secondary/20 rounded-full animate-float opacity-30 animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-accent/20 rounded-full animate-float opacity-30 animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/6 w-2 h-2 bg-primary/15 rounded-full animate-float opacity-30 animation-delay-1500"></div>
      </div>
    </div>
  );
};

export default TopicLoader;