import React from 'react';
import { BookOpen, Lightbulb, Code2, Wrench } from 'lucide-react';
import InlineVisual from './InlineVisual';

interface ContentSectionProps {
  section: {
    title: string;
    content: string;
    type: 'definition' | 'concept' | 'example' | 'implementation';
    visualSuggestion?: string;
  };
  index: number;
  inlineVisuals?: {
    images: any[];
    videos: any[];
  };
}

const ContentSection: React.FC<ContentSectionProps> = ({ 
  section, 
  index, 
  inlineVisuals 
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'definition':
        return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'concept':
        return <Lightbulb className="h-4 w-4 text-yellow-600" />;
      case 'example':
        return <Code2 className="h-4 w-4 text-green-600" />;
      case 'implementation':
        return <Wrench className="h-4 w-4 text-purple-600" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'definition':
        return 'Definition';
      case 'concept':
        return 'Concept';
      case 'example':
        return 'Example';
      case 'implementation':
        return 'Implementation';
      default:
        return 'Section';
    }
  };

  const hasVisuals = inlineVisuals && (inlineVisuals.images.length > 0 || inlineVisuals.videos.length > 0);

  return (
    <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
      {/* Section Header */}
      <div className="flex items-center space-x-2 mb-3">
        {getIcon(section.type)}
        <div>
          <h4 className="font-medium text-foreground">{section.title}</h4>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {getTypeLabel(section.type)}
          </span>
        </div>
      </div>

      {/* Content with inline visual */}
      <div className={`${hasVisuals ? 'md:flex md:items-start md:space-x-4' : ''}`}>
        <div className={`${hasVisuals ? 'md:flex-1' : ''}`}>
          <div className="prose prose-sm max-w-none text-foreground">
            {section.content.split('\n').map((paragraph, pIndex) => (
              paragraph.trim() && (
                <p key={pIndex} className="mb-2 leading-relaxed text-foreground">
                  {paragraph}
                </p>
              )
            ))}
          </div>
        </div>

        {/* Inline Visual */}
        {hasVisuals && (
          <div className="mt-3 md:mt-0 md:flex-shrink-0">
            <InlineVisual 
              visuals={inlineVisuals} 
              size="md"
              className="float-right md:float-none ml-4 md:ml-0 mb-2 md:mb-0"
            />
          </div>
        )}
      </div>

      {/* Visual suggestion hint for debugging */}
      {section.visualSuggestion && !hasVisuals && import.meta.env.DEV && (
        <div className="mt-2 text-xs text-muted-foreground/70 italic">
          Visual suggestion: {section.visualSuggestion}
        </div>
      )}
    </div>
  );
};

export default ContentSection;