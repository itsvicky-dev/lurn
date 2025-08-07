import React from 'react';
import { Image, Video, ExternalLink } from 'lucide-react';

interface VisualAid {
  type: 'image' | 'video';
  url: string;
  embedUrl?: string;
  caption?: string;
  description?: string;
  source?: string;
  thumbnail?: string;
  author?: string;
  authorUrl?: string;
}

interface InlineVisualProps {
  visuals: {
    images: VisualAid[];
    videos: VisualAid[];
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const InlineVisual: React.FC<InlineVisualProps> = ({ 
  visuals, 
  className = '', 
  size = 'sm' 
}) => {
  const { images, videos } = visuals;
  
  if (!images.length && !videos.length) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-32',
    md: 'h-48',
    lg: 'h-64'
  };

  const containerClasses = {
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md'
  };

  // Show the first available visual (prefer images for inline display)
  const visual = images[0] || videos[0];
  if (!visual) return null;

  return (
    <div className={`inline-block ${containerClasses[size]} ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Visual Content */}
        {visual.type === 'image' && (
          <div className="relative">
            <img
              src={visual.url}
              alt={visual.caption || 'Inline visual'}
              className={`w-full ${sizeClasses[size]} object-cover`}
              onError={(e) => {
                // Fallback to thumbnail if main image fails
                if (visual.thumbnail && e.currentTarget.src !== visual.thumbnail) {
                  e.currentTarget.src = visual.thumbnail;
                }
              }}
            />
            {visual.source && (
              <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded">
                {visual.source}
              </div>
            )}
          </div>
        )}

        {visual.type === 'video' && (
          <div className="relative">
            {visual.embedUrl ? (
              <div className={`relative ${sizeClasses[size]} overflow-hidden`}>
                <iframe
                  src={visual.embedUrl}
                  title={visual.caption || 'Inline video'}
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : visual.thumbnail ? (
              <div className="relative">
                <img
                  src={visual.thumbnail}
                  alt={visual.caption || 'Video thumbnail'}
                  className={`w-full ${sizeClasses[size]} object-cover`}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-full p-2">
                    <Video className="h-4 w-4 text-primary-600" />
                  </div>
                </div>
                {visual.url && (
                  <a
                    href={visual.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-1 right-1 bg-primary-600 text-white p-1 rounded-full hover:bg-primary-700 transition-colors"
                    title="Watch video"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ) : (
              <div className={`flex items-center justify-center ${sizeClasses[size]} bg-gray-100`}>
                <Video className="h-8 w-8 text-gray-400" />
              </div>
            )}
            {visual.source && (
              <div className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1 py-0.5 rounded">
                {visual.source}
              </div>
            )}
          </div>
        )}

        {/* Caption */}
        {visual.caption && (
          <div className="p-2">
            <p className="text-xs text-gray-600 line-clamp-2">{visual.caption}</p>
            {visual.author && (
              <p className="text-xs text-gray-500 mt-1">
                By: {visual.authorUrl ? (
                  <a 
                    href={visual.authorUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {visual.author}
                  </a>
                ) : visual.author}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineVisual;