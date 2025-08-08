import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';

interface MobileMessageProps {
  onEnableDesktopView: () => void;
}

const MobileMessage: React.FC<MobileMessageProps> = ({ onEnableDesktopView }) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Mobile Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <Smartphone className="w-16 h-16 text-primary" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-destructive-foreground text-xs font-bold">!</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground">
          Mobile View in Progress
        </h1>

        {/* Description */}
        <div className="space-y-4 text-muted-foreground">
          <p>
            We're currently working on optimizing the mobile experience for this application.
          </p>
          <p>
            For the best experience, please use a desktop or laptop computer.
          </p>
        </div>

        {/* Desktop View Button */}
        <div className="space-y-4">
          <div
            // onClick={onEnableDesktopView}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Monitor className="w-5 h-5" />
            Enable Desktop View
          </div>
          
          <p className="text-xs text-muted-foreground">
            Note: Desktop view on mobile may not be fully optimized and some features might not work as expected.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Mobile optimization in progress...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMessage;