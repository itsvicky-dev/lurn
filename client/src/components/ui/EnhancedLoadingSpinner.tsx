import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Brain,
  Zap,
  BookOpen,
  Target,
  Lightbulb,
  Code, 
  Rocket,
  Star,
  Coffee,
  Wand2,
  Atom,
  Cpu,
  Palette,
  Gamepad2,
  Play,
  X,
  Circle,
  Hand
} from 'lucide-react';
import GameModal from '../games/GameModal';

interface EnhancedLoadingSpinnerProps {
  type: 'learning-path' | 'modules' | 'topics' | 'course' | 'general' | 'onboarding';
  title?: string;
  showNotificationPrompt?: boolean;
  onNotificationPermissionRequest?: () => void;
  className?: string;
  showGames?: boolean;
}



const EnhancedLoadingSpinner: React.FC<EnhancedLoadingSpinnerProps> = ({
  type,
  title,
  showNotificationPrompt = false,
  onNotificationPermissionRequest,
  className = '',
  showGames = true,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showGameOptions, setShowGameOptions] = useState(false);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<'tictactoe' | 'rockpaperscissors' | null>(null);

  const loadingMessages = {
    'onboarding': [
      "🤖 AI is getting to know you personally...",
      "✨ Sprinkling some personalization magic...",
      "🎯 Calibrating your learning superpowers...",
      "📚 Building your personal knowledge fortress...",
      "💡 Teaching the AI to be your best friend...",
      "⚡ Charging up your learning adventure...",
      "🧠 Creating your educational masterpiece...",
      "🌟 Almost ready to blow your mind...",
      "🎪 Preparing your learning circus...",
      "📖 Writing your personalized success story...",
      "🔥 Igniting your curiosity flames...",
      "🚀 Launching your knowledge rockets...",
    ],
    'learning-path': [
      "🤖 AI is brewing some knowledge magic...",
      "💡 Cooking up brilliant learning recipes...",
      "✨ Sprinkling some educational fairy dust...",
      "📚 Crafting mind-blowing learning adventures...",
      "🎯 Aiming for maximum 'aha!' moments...",
      "⚡ Charging up your brain cells...",
      "🧠 Teaching the AI to teach you better...",
      "💭 Having deep thoughts about your subject...",
      "🌟 Making learning irresistibly addictive...",
      "📖 Writing your personalized textbook...",
      "🎪 Preparing an educational extravaganza...",
      "🚀 Launching knowledge into your brain...",
      "🎨 Painting masterpieces of understanding...",
      "🔥 Igniting your learning passion...",
      "✨ Almost ready to revolutionize your mind...",
    ],
    'modules': [
      "🔍 Analyzing course structure...",
      "📖 Creating comprehensive modules...",
      "🎯 Organizing learning sequences...",
      "💡 Designing engaging activities...",
      "✨ Adding practical examples...",
      "⚡ Polishing module content...",
      "🧠 Finalizing your modules...",
    ],
    'topics': [
      "🤖 AI is brewing some knowledge magic...",
      "💡 Cooking up brilliant explanations...",
      "✨ Sprinkling some learning fairy dust...",
      "📚 Crafting mind-blowing examples...",
      "🎯 Aiming for 'aha!' moments...",
      "⚡ Charging up your brain cells...",
      "🧠 Teaching the AI to teach you better...",
      "💭 Having deep thoughts about your topic...",
      "🌟 Making learning irresistibly fun...",
      "📖 Writing your personalized textbook...",
      "🎪 Preparing an educational circus...",
      "🚀 Launching knowledge rockets...",
      "🎨 Painting masterpieces of understanding...",
      "🔥 Igniting your curiosity flames...",
      "✨ Almost ready to blow your mind...",
    ],
    'course': [
      "🎯 Designing course curriculum...",
      "📚 Structuring learning materials...",
      "🧠 Creating assessment strategies...",
      "✨ Preparing your course...",
    ],
    'general': [
      "🤖 AI is working its magic...",
      "⚡ Processing your request...",
      "✨ Almost there...",
    ],
  };

  const encouragingMessages = {
    onboarding: [
      "The AI is having a 'getting to know you' party! 🎉",
      "Your personalized learning genie is waking up! 🧞‍♂️",
      "AI is reading your mind... just kidding, your preferences! 🧠",
      "Building your educational fortress of awesomeness! 🏰",
      "Your future genius self is already thanking you! 🤓",
      "The AI is consulting with Einstein's ghost for tips! 👻",
      "Brewing the perfect learning potion just for you! 🧪",
      "Your learning adventure is loading... please wait for magic! ✨",
      "The AI is having deep philosophical thoughts about you! 🤔",
      "Creating your personal knowledge empire! 👑",
      "Your AI tutor is practicing its best teaching moves! 💃",
      "Patience, young padawan... greatness is loading! ⏰",
      "The AI is channeling its inner teaching genius! 🎭",
      "Building bridges to your brilliant future! 🌉",
      "Your learning sanctuary is under construction! 🏗️",
      "The AI is getting its PhD in 'Teaching You'! 🎓",
      "Crafting your educational masterpiece! 🎨",
      "Your brain is about to get the VIP treatment! ⭐",
      "The AI is having eureka moments about your learning! 💡",
      "Preparing to make learning as fun as your favorite game! 🎮",
    ],
    'learning-path': [
      "The AI is having deep thoughts about your learning path! 🤔",
      "Connecting the dots for maximum 'aha!' moments! 🔗",
      "Making sure every step is mind-blowingly awesome! 🤯",
      "Teaching the AI to be your personal learning wizard! 🧙‍♂️",
      "Crafting content that'll make you go 'wow!'! 😲",
      "The AI is reading every book ever written... almost! 📚",
      "Brewing knowledge like a master chef! 👨‍🍳",
      "Making learning so fun, you'll forget it's educational! 🎪",
      "The AI is consulting with learning experts from the future! 🚀",
      "Turning complex topics into simple magic tricks! 🪄",
      "Your learning path is getting the VIP treatment! ⭐",
      "The AI is having creative breakthroughs every second! 💥",
      "Polishing every concept until it sparkles! ✨",
      "Making sure your brain gets the ultimate workout! 💪",
      "The AI is channeling its inner teaching genius! 🧠",
      "Crafting explanations so good, even aliens would understand! 👽",
      "The AI is painting a masterpiece of knowledge! 🎨",
      "Making learning as addictive as your favorite show! 📺",
      "The AI is having philosophical moments about your subject! 🤯",
      "Turning your learning path into an epic adventure! 🗺️",
    ],
    general: [
      "Great things take time! 🌟",
      "Your patience will be rewarded! 🎁",
      "Quality content is being crafted! 🎨",
      "AI is working hard for you! 🤖",
      "Something amazing is coming! 🚀",
      "Worth the wait, we promise! 💎",
      "Excellence requires patience! 🏆",
      "Creating magic takes time! ✨",
      "The AI is having a eureka moment! 💡",
      "Brewing the perfect learning potion! 🧪",
      "Your brain will thank you later! 🧠",
      "Making learning addictively fun! 🎮",
      "Crafting your personal knowledge gem! 💎",
      "The wait makes victory sweeter! 🍯",
      "Building your learning empire! 🏰",
      "Patience is the key to wisdom! 🗝️",
      "Good things come to those who wait! ⏰",
      "Your future self will love this! 💝",
      "Quality over speed, always! 🐢",
      "The best is yet to come! 🌈",
    ],
    topics: [
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
      "The AI is painting a masterpiece of knowledge! 🎨",
      "Making learning as addictive as your favorite game! 🎮",
      "The AI is having a philosophical moment! 🤯",
      "Turning your topic into an adventure story! 📖",
    ],
    modules: [
      "The AI is having deep thoughts about your modules! 🤔",
      "Connecting the dots for maximum 'aha!' moments! 🔗",
      "Making sure every module is mind-blowing! 🤯",
      "Teaching the AI to be your best teacher! 👨‍🏫",
      "Crafting content that'll make you go 'wow!'! 😲",
      "The AI is reading every book ever written... kidding! 📚",
      "Brewing knowledge like a master chef! 👨‍🍳",
      "Making learning so fun, you'll forget it's educational! 🎪",
      "The AI is consulting with Einstein's ghost! 👻",
      "Turning complex modules into simple magic! 🪄",
      "Your modules are getting the VIP treatment! ⭐",
      "The AI is having a creative breakthrough! 💥",
      "Polishing every word until it sparkles! ✨",
      "Making sure your brain gets the best workout! 💪",
      "The AI is channeling its inner genius! 🧠",
      "Crafting explanations that even your grandma would understand! 👵",
    ],
    course: [
      "The AI is having deep thoughts about your course! 🤔",
      "Connecting the dots for maximum 'aha!' moments! 🔗",
      "Making sure every lesson is mind-blowing! 🤯",
      "Teaching the AI to be your best teacher! 👨‍🏫",
      "Crafting content that'll make you go 'wow!'! 😲",
      "The AI is reading every book ever written... kidding! 📚",
      "Brewing knowledge like a master chef! 👨‍🍳",
      "Making learning so fun, you'll forget it's educational! 🎪",
      "The AI is consulting with Einstein's ghost! 👻",
      "Turning complex courses into simple magic! 🪄",
      "Your course is getting the VIP treatment! ⭐",
      "The AI is having a creative breakthrough! 💥",
      "Polishing every word until it sparkles! ✨",
      "Making sure your brain gets the best workout! 💪",
      "The AI is channeling its inner genius! 🧠",
      "Crafting explanations that even your grandma would understand! 👵",
    ]
  };

  const icons = [Brain, Lightbulb, Sparkles, BookOpen, Target, Zap, Code, Rocket, Star, Coffee, Wand2, Atom, Cpu, Palette];

  useEffect(() => {
    // Cycle through messages every 2.5 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % (loadingMessages[type]?.length || loadingMessages.general.length));
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

    // Show game options after 10 seconds if enabled
    const gameOptionsTimeout = setTimeout(() => {
      if (showGames) {
        setShowGameOptions(true);
      }
    }, 10000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(iconInterval);
      clearTimeout(encouragementTimeout);
      clearTimeout(statsTimeout);
      clearTimeout(gameOptionsTimeout);
    };
  }, [type, icons.length, showGames]);

  const CurrentIcon = icons[currentIconIndex];

  const handleGameSelect = (gameType: 'tictactoe' | 'rockpaperscissors') => {
    setSelectedGame(gameType);
    setGameModalOpen(true);
  };

  const handleGameModalClose = () => {
    setGameModalOpen(false);
    setSelectedGame(null);
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[500px] p-8 ${className}`}>
      {/* Main Loading Animation */}
      <div className="relative mb-8">
        {/* Outer rotating rings */}
        <div className="absolute inset-0 w-32 h-32 border-4 border-primary/20 rounded-full animate-spin border-t-primary"></div>
        <div className="absolute inset-2 w-28 h-28 border-3 border-secondary/20 rounded-full animate-spin border-b-secondary animation-delay-300" style={{ animationDirection: 'reverse' }}></div>
        <div className="absolute inset-4 w-24 h-24 border-2 border-accent/20 rounded-full animate-spin border-r-accent animation-delay-700"></div>
        
        {/* Center icon container */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-500 hover:scale-110 animate-pulse">
            <CurrentIcon className="w-8 h-8 text-primary-foreground animate-bounce" />
          </div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute -top-4 -right-4 w-4 h-4 bg-primary/60 rounded-full animate-ping"></div>
        <div className="absolute -bottom-4 -left-4 w-3 h-3 bg-secondary/60 rounded-full animate-ping animation-delay-500"></div>
        <div className="absolute top-1/2 -left-6 w-2 h-2 bg-accent/60 rounded-full animate-ping animation-delay-1000"></div>
        <div className="absolute top-1/4 -right-6 w-3 h-3 bg-primary/60 rounded-full animate-ping animation-delay-200"></div>
        <div className="absolute bottom-1/4 -left-8 w-2 h-2 bg-secondary/60 rounded-full animate-ping animation-delay-800"></div>
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
          {loadingMessages[type]?.[currentMessageIndex % loadingMessages[type].length] || loadingMessages.general[currentMessageIndex % loadingMessages.general.length]}
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
            {encouragingMessages[type]?.[currentMessageIndex % encouragingMessages[type].length] || encouragingMessages.general[currentMessageIndex % encouragingMessages.general.length]}
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

      {/* Game Options */}
      {showGameOptions && showGames && (
        <div className="mt-8 p-6 bg-card rounded-xl border border-border max-w-md animate-in fade-in-0 slide-in-from-bottom-4">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Gamepad2 className="h-5 w-5 text-primary" />
            <p className="text-card-foreground font-bold">Play While You Wait!</p>
          </div>
          <p className="text-muted-foreground text-sm mb-4 text-center">
            Make the wait time fun with quick games!
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleGameSelect('tictactoe')}
              className="p-3 bg-background rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all group"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <X className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-foreground">Tic-Tac-Toe</span>
              </div>
            </button>
            
            <button
              onClick={() => handleGameSelect('rockpaperscissors')}
              className="p-3 bg-background rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all group"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Hand className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-foreground">Rock Paper Scissors</span>
              </div>
            </button>
          </div>
          
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              🎮 Games won't interrupt your learning progress!
            </p>
          </div>
        </div>
      )}

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
          <span className="text-sm text-muted-foreground">Usually takes 1-3 minutes</span>
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
        <div className="absolute bottom-1/4 right-1/6 w-2 h-2 bg-primary/20 rounded-full animate-float opacity-30 animation-delay-1500"></div>
      </div>

      {/* Game Modal */}
      <GameModal
        isOpen={gameModalOpen}
        onClose={handleGameModalClose}
        gameType={selectedGame}
        title="Quick Game While Loading"
      />
    </div>
  );
};

export default EnhancedLoadingSpinner;