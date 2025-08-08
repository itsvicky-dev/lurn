import { useState, useEffect } from 'react';

interface MobileDetectionResult {
  isMobile: boolean;
  isDesktopView: boolean;
  enableDesktopView: () => void;
  disableDesktopView: () => void;
}

// Helper function to detect if browser is in desktop mode
const detectDesktopMode = (): boolean => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check if it's a mobile device by user agent
  const isMobileDevice = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'mobile'
  ].some(keyword => userAgent.includes(keyword));
  
  if (!isMobileDevice) {
    return false; // Not a mobile device, so not in desktop mode
  }
  
  // For mobile devices, detect desktop mode by viewport dimensions
  // Desktop mode typically results in:
  // 1. Much wider viewport (> 1024px)
  // 2. Aspect ratio closer to desktop (width significantly larger than height)
  const aspectRatio = width / height;
  
  // Desktop mode indicators:
  // - Width > 1024px (typical desktop breakpoint)
  // - Aspect ratio > 1.3 (landscape and wide)
  // - OR width > 1200px (definitely desktop mode regardless of ratio)
  return (
    (width > 1024 && aspectRatio > 1.3) || 
    width > 1200
  );
};

export const useMobileDetection = (): MobileDetectionResult => {
  // Initialize with localStorage value to prevent flash
  const [isDesktopView, setIsDesktopView] = useState(() => {
    try {
      // Check if user has manually enabled desktop view
      if (localStorage.getItem('forceDesktopView') === 'true') {
        return true;
      }
      
      // Auto-detect browser desktop mode
      return detectDesktopMode();
    } catch {
      return false;
    }
  });
  
  const [isMobile, setIsMobile] = useState(() => {
    // Initial mobile detection
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'android', 'webos', 'iphone', 'ipad', 'ipod', 
      'blackberry', 'windows phone', 'mobile'
    ];
    
    const isMobileDevice = mobileKeywords.some(keyword => 
      userAgent.includes(keyword)
    );
    
    // Check screen width (use a more conservative breakpoint)
    const isSmallScreen = window.innerWidth <= 1024;
    
    return isMobileDevice || isSmallScreen;
  });

  useEffect(() => {
    const checkMobileAndDesktopMode = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        'android', 'webos', 'iphone', 'ipad', 'ipod', 
        'blackberry', 'windows phone', 'mobile'
      ];
      
      const isMobileDevice = mobileKeywords.some(keyword => 
        userAgent.includes(keyword)
      );
      
      // Update mobile detection based on device and screen size
      const isSmallScreen = window.innerWidth <= 1024;
      setIsMobile(isMobileDevice || isSmallScreen);
      
      // Update desktop view detection
      const forcedDesktopView = localStorage.getItem('forceDesktopView');
      
      if (forcedDesktopView === 'true') {
        setIsDesktopView(true); // User manually enabled desktop view
      } else if (forcedDesktopView === 'false') {
        setIsDesktopView(false); // User manually disabled desktop view
      } else {
        // Auto-detect browser desktop mode when no manual override
        setIsDesktopView(detectDesktopMode());
      }
    };

    // Check on resize with debounce
    let timeoutId: NodeJS.Timeout;
    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobileAndDesktopMode, 100);
    };

    // Initial check
    checkMobileAndDesktopMode();

    // Listen for resize events
    window.addEventListener('resize', debouncedCheck);
    
    // Listen for orientation change (mobile devices)
    window.addEventListener('orientationchange', debouncedCheck);

    return () => {
      window.removeEventListener('resize', debouncedCheck);
      window.removeEventListener('orientationchange', debouncedCheck);
      clearTimeout(timeoutId);
    };
  }, []);

  const enableDesktopView = () => {
    console.log('Enabling desktop view');
    setIsDesktopView(true);
    try {
      localStorage.setItem('forceDesktopView', 'true');
    } catch (error) {
      console.error('Failed to save desktop view preference:', error);
    }
  };

  const disableDesktopView = () => {
    console.log('Disabling desktop view');
    setIsDesktopView(false);
    try {
      localStorage.setItem('forceDesktopView', 'false');
    } catch (error) {
      console.error('Failed to save desktop view preference:', error);
    }
  };

  // Debug logging
  console.log('Mobile Detection:', { 
    isMobile, 
    isDesktopView, 
    userAgent: navigator.userAgent, 
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    aspectRatio: (window.innerWidth / window.innerHeight).toFixed(2),
    autoDetectedDesktopMode: detectDesktopMode(),
    forcedDesktopView: localStorage.getItem('forceDesktopView')
  });

  return {
    isMobile,
    isDesktopView,
    enableDesktopView,
    disableDesktopView
  };
};