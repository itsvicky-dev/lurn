/**
 * Utility to handle socket connection errors gracefully
 */

let hasShownSocketWarning = false;

export const handleSocketError = (error: any) => {
  // Only show warning once per session to avoid spam
  if (!hasShownSocketWarning) {
    console.warn('Socket connection failed - this is normal if the server is not running or if you\'re offline:', error.message);
    hasShownSocketWarning = true;
  }
  
  // Don't throw or show user-facing errors for socket connection issues
  // The app should work fine without real-time features
};

export const resetSocketWarning = () => {
  hasShownSocketWarning = false;
};

export const isSocketConnectionError = (error: any): boolean => {
  return error?.message?.includes('websocket') || 
         error?.message?.includes('transport') ||
         error?.type === 'TransportError' ||
         error?.name === 'TransportError';
};