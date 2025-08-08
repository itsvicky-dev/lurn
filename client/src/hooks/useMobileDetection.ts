import { useState, useEffect } from 'react';

interface MobileDetectionResult {
  isMobile: boolean;
  isDesktopView: boolean;
  enableDesktopView: () => void;
  disableDesktopView: () => void;
}

export const useMobileDetection = (): MobileDetectionResult => {
  // Initialize with localStorage value to prevent flash
  const [isDesktopView, setIsDesktopView] = useState(() => {
    try {
      return localStorage.getItem('forceDesktopView') === 'true';
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
    const checkMobile = () => {
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
      
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    // Check on resize with debounce
    let timeoutId: NodeJS.Timeout;
    const debouncedCheckMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 100);
    };

    window.addEventListener('resize', debouncedCheckMobile);

    return () => {
      window.removeEventListener('resize', debouncedCheckMobile);
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
      localStorage.removeItem('forceDesktopView');
    } catch (error) {
      console.error('Failed to remove desktop view preference:', error);
    }
  };

  // Debug logging
  console.log('Mobile Detection:', { isMobile, isDesktopView, userAgent: navigator.userAgent, screenWidth: window.innerWidth });

  return {
    isMobile,
    isDesktopView,
    enableDesktopView,
    disableDesktopView
  };
};