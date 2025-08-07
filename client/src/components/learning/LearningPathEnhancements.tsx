import React from 'react';
import { 
  BookOpen, 
  Layers, 
  Plus, 
  Zap, 
  Target,
  Clock,
  CheckCircle
} from 'lucide-react';

const LearningPathEnhancements: React.FC = () => {
  const enhancements = [
    {
      title: 'Comprehensive Content Generation',
      description: 'Generate 8-15 modules with 8-14 topics each, providing extensive learning material',
      icon: Layers,
      features: [
        'Initial batch: 8-10 modules with 8-12 topics',
        'Extended batch: 12-15 modules with 10-14 topics',
        'Detailed topic descriptions and learning objectives'
      ]
    },
    {
      title: 'Enhanced Topic Content',
      description: 'Each topic now contains substantial learning material for deep understanding',
      icon: BookOpen,
      features: [
        '5-8 comprehensive code examples per topic',
        '5-7 quiz questions testing deep understanding',
        'Real-world applications and practical scenarios',
        'Detailed explanations and visual suggestions'
      ]
    },
    {
      title: 'Load More Functionality',
      description: 'Dynamically expand your learning paths with additional content',
      icon: Plus,
      features: [
        'Load 5 additional modules per request',
        'Generate 5 additional topics per module',
        'Progressive content loading to avoid timeouts',
        'Seamless integration with existing content'
      ]
    },
    {
      title: 'Improved AI Generation',
      description: 'Enhanced prompts and longer token limits for better content quality',
      icon: Zap,
      features: [
        'Increased token limits (12,000 for topics)',
        'Professional-grade content generation',
        'Better error handling and retry mechanisms',
        'Content filtering for appropriate material'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Enhanced Learning Path System
        </h2>
        <p className="text-muted-foreground">
          Comprehensive improvements for better learning experiences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {enhancements.map((enhancement, index) => {
          const Icon = enhancement.icon;
          return (
            <div key={index} className="card">
              <div className="card-content p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">
                      {enhancement.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {enhancement.description}
                    </p>
                    <ul className="space-y-2">
                      {enhancement.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="card-content p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">
                How to Use Enhanced Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                  <span className="text-muted-foreground">Choose "Enhanced Path" when creating</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                  <span className="text-muted-foreground">Use "Load More" buttons for additional content</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                  <span className="text-muted-foreground">Enjoy comprehensive learning experience</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathEnhancements;