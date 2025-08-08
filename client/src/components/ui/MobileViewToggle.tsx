import React, { useState } from 'react';
import { Smartphone, X } from 'lucide-react';

interface MobileViewToggleProps {
  onDisableDesktopView: () => void;
}

const MobileViewToggle: React.FC<MobileViewToggleProps> = ({ onDisableDesktopView }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 flex items-center gap-3 max-w-sm">
        <Smartphone className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-card-foreground">
            Desktop View on Mobile
          </p>
          <p className="text-xs text-muted-foreground">
            Some features may not work optimally
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onDisableDesktopView}
            className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-1 rounded transition-colors"
          >
            Switch Back
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileViewToggle;