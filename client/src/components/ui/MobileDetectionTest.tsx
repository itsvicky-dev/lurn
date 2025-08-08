import React from 'react';
import { useMobileDetection } from '../../hooks/useMobileDetection';

const MobileDetectionTest: React.FC = () => {
  const { isMobile, isDesktopView, enableDesktopView, disableDesktopView } = useMobileDetection();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Mobile Detection Test</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <h2 className="font-semibold mb-2">Detection Results:</h2>
            <p><strong>Is Mobile:</strong> {isMobile ? 'Yes' : 'No'}</p>
            <p><strong>Desktop View Enabled:</strong> {isDesktopView ? 'Yes' : 'No'}</p>
            <p><strong>Screen Width:</strong> {window.innerWidth}px</p>
            <p><strong>Screen Height:</strong> {window.innerHeight}px</p>
            <p><strong>Aspect Ratio:</strong> {(window.innerWidth / window.innerHeight).toFixed(2)}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</p>
            <p><strong>Auto-Detected Desktop Mode:</strong> {(() => {
              const userAgent = navigator.userAgent.toLowerCase();
              const isMobileDevice = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile'].some(keyword => userAgent.includes(keyword));
              if (!isMobileDevice) return 'N/A (Not mobile device)';
              const width = window.innerWidth;
              const height = window.innerHeight;
              const aspectRatio = width / height;
              return ((width > 1024 && aspectRatio > 1.3) || width > 1200) ? 'Yes' : 'No';
            })()}</p>
            <p><strong>Forced View Setting:</strong> {localStorage.getItem('forceDesktopView') || 'None'}</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={enableDesktopView}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Enable Desktop View
            </button>
            
            <button
              onClick={disableDesktopView}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              Disable Desktop View
            </button>
          </div>

          <div className="p-4 bg-yellow-50 rounded">
            <h3 className="font-semibold mb-2">Current State:</h3>
            {isMobile && !isDesktopView && (
              <p className="text-red-600">Would show mobile message</p>
            )}
            {(!isMobile || isDesktopView) && (
              <p className="text-green-600">Would show full app</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDetectionTest;