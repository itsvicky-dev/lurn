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
      // Check if user has manually enabled desktop view
      if (localStorage.getItem('forceDesktopView') === 'true') {
        return true;
      }
      
      // Check if browser is in desktop mode (wider viewport on mobile device)
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile']
        .some(keyword => userAgent.includes(keyword));
      
      // If it's a mobile device but has a wide viewport, likely desktop mode is enabled
      if (isMobileDevice && window.innerWidth > 1024) {
        return true;
      }
      
      return false;
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
      
      // Check screen width (use a more conservative breakpoint)
      const isSmallScreen = window.innerWidth <= 1024;
      
      setIsMobile(isMobileDevice || isSmallScreen);
      
      // Check if mobile device is in desktop mode (wide viewport)
      if (isMobileDevice && window.innerWidth > 1024 && !localStorage.getItem('forceDesktopView')) {
        setIsDesktopView(true);
      } else if (isMobileDevice && window.innerWidth <= 1024 && !localStorage.getItem('forceDesktopView')) {
        setIsDesktopView(false);
      }
    };

    // Check on resize with debounce
    let timeoutId: NodeJS.Timeout;
    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobileAndDesktopMode, 100);
    };

    window.addEventListener('resize', debouncedCheck);

    return () => {
      window.removeEventListener('resize', debouncedCheck);
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