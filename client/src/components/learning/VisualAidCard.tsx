import React from 'react';
import { Image, Video, ExternalLink, BarChart3 } from 'lucide-react';

interface VisualAid {
  type: 'image' | 'video' | 'chart' | 'diagram';
  url?: string;
  embedUrl?: string;
  caption?: string;
  description?: string;
  source?: string;
  thumbnail?: string;
  author?: string;
  authorUrl?: string;
  title?: string;
}

interface VisualAidCardProps {
  aid: VisualAid;
  index: number;
  className?: string;
}

const VisualAidCard: React.FC<VisualAidCardProps> = ({ aid, index, className = '' }) => {
  const renderImageContent = () => (
    <div className="relative">
      <img
        src={aid.url}
        alt={aid.caption || aid.title || 'Visual aid'}
        className="w-full h-64 object-contain bg-muted/30"
        onError={(e) => {
          // Fallback to thumbnail if main image fails
          if (aid.thumbnail && e.currentTarget.src !== aid.thumbnail) {
            e.currentTarget.src = aid.thumbnail;
          }
        }}
      />
      {aid.source && (
        <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
          {aid.source}
        </div>
      )}
    </div>
  );

  const renderVideoContent = () => (
    <div className="relative">
      {aid.embedUrl ? (
        <div className="relative pb-[56.25%] h-0 overflow-hidden bg-black">
          <iframe
            src={aid.embedUrl}
            title={aid.caption || aid.title || 'Educational video'}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : aid.thumbnail ? (
        <div className="relative">
          <img
            src={aid.thumbnail}
            alt={aid.caption || aid.title || 'Video thumbnail'}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-full p-4">
              <Video className="h-12 w-12 text-red-600" />
            </div>
          </div>
          {aid.url && (
            <a
              href={aid.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
              title="Watch on YouTube"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 bg-muted/50">
          <Video className="h-16 w-16 text-muted-foreground" />
        </div>
      )}
      {aid.source && (
        <div className="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
          {aid.source}
        </div>
      )}
    </div>
  );

  const renderChartContent = () => (
    <div className="flex items-center justify-center h-64 bg-muted/30">
      <BarChart3 className="h-16 w-16 text-muted-foreground" />
    </div>
  );

  const renderContent = () => {
    switch (aid.type) {
      case 'image':
        return renderImageContent();
      case 'video':
        return renderVideoContent();
      case 'chart':
      case 'diagram':
        return renderChartContent();
      default:
        return null;
    }
  };

  const getTypeIcon = () => {
    switch (aid.type) {
      case 'image':
        return <Image className="h-4 w-4 text-primary-600" />;
      case 'video':
        return <Video className="h-4 w-4 text-red-600" />;
      case 'chart':
      case 'diagram':
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = () => {
    switch (aid.type) {
      case 'image':
        return 'border-l-primary-500';
      case 'video':
        return 'border-l-red-500';
      case 'chart':
      case 'diagram':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <div className={`border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 bg-card border-l-4 ${getTypeColor()} ${className}`}>
      {/* Content */}
      {renderContent()}
      
      {/* Information Panel */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getTypeIcon()}
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {aid.type}
            </span>
          </div>
          <span className="text-xs text-muted-foreground/70">#{index + 1}</span>
        </div>
        
        {(aid.caption || aid.title) && (
          <h5 className="font-medium text-card-foreground mb-2 line-clamp-2">
            {aid.caption || aid.title}
          </h5>
        )}
        
        {aid.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {aid.description}
          </p>
        )}
        
        {/* Actions and Attribution */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {aid.author && (
              <div className="text-xs text-muted-foreground">
                <span>
                  By: {aid.authorUrl ? (
                    <a 
                      href={aid.authorUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {aid.author}
                    </a>
                  ) : aid.author}
                </span>
              </div>
            )}
          </div>
          
          {/* External Link for Videos */}
          {aid.type === 'video' && aid.url && (
            <a
              href={aid.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">YouTube</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualAidCard;