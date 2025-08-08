import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { useMobileDetection } from '../../hooks/useMobileDetection';

const MobileMessage: React.FC = () => {
  const { enableDesktopView } = useMobileDetection();
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

        {/* Instructions for Desktop View */}
        <div className="space-y-4">
          <div className="p-4 bg-card/50 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <Monitor className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-card-foreground">Enable Desktop View</h3>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>For Chrome/Safari:</strong></p>
              <p>• Tap the menu (⋮ or aA) → "Request Desktop Site"</p>
              <p><strong>For Firefox:</strong></p>
              <p>• Tap the menu (⋮) → "Desktop site"</p>
            </div>
          </div>

          {/* Manual Override Button */}
          {/* <div className="pt-4">
            <button
              onClick={enableDesktopView}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Force Desktop View
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Use this if auto-detection isn't working
            </p>
          </div> */}

          {/* Debug Info */}
          {/* <div className="pt-4 text-xs text-muted-foreground">
            <p><strong>Screen:</strong> {window.innerWidth} × {window.innerHeight}</p>
            <p><strong>Ratio:</strong> {(window.innerWidth / window.innerHeight).toFixed(2)}</p>
          </div> */}
        </div>

        {/* Progress Indicator */}
        <div className="pt-6">
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