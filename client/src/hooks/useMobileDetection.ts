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
  // Desktop mode typically results in wider viewport
  const aspectRatio = width / height;
  
  // Very aggressive desktop mode detection for mobile devices:
  // If it's a mobile device and has any of these characteristics, consider it desktop mode:
  // 1. Width >= 768px (most common desktop mode width)
  // 2. OR width > 640px AND aspect ratio > 1.1 (landscape with decent width)
  // 3. OR width > 480px AND aspect ratio > 1.5 (very wide landscape)
  const isDesktopMode = width >= 768 || 
                       (width > 640 && aspectRatio > 1.1) ||
                       (width > 480 && aspectRatio > 1.5);
  
  // Enhanced logging for debugging
  console.log('Desktop Mode Detection:', {
    width,
    height,
    aspectRatio: aspectRatio.toFixed(2),
    isMobileDevice,
    isDesktopMode,
    userAgent: userAgent.substring(0, 50)
  });
  
  return isDesktopMode;
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
    const isSmallScreen = window.innerWidth <= 768;
    
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
      const isSmallScreen = window.innerWidth <= 768;
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