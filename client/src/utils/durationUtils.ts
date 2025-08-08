/**
 * Utility functions for formatting duration values
 */

/**
 * Formats duration based on the context and value
 * Learning paths: duration might be in minutes (if > 100) or hours (if <= 100)
 * Modules and Topics: duration is always in minutes
 */
export const formatLearningPathDuration = (duration: number): string => {
  // If duration seems too large (>100), it's likely in minutes, convert to hours
  if (duration > 100) {
    const hours = Math.round(duration / 60 * 10) / 10; // Round to 1 decimal place
    return hours < 1 ? `${duration} min` : `${hours}h`;
  }
  // If duration is reasonable (<= 100), assume it's already in hours
  return `${duration}h`;
};

/**
 * Formats module/topic duration (always in minutes)
 */
export const formatModuleDuration = (duration: number): string => {
  if (duration >= 60) {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  }
  return `${duration} min`;
};

/**
 * Converts minutes to hours with proper formatting
 */
export const minutesToHours = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Calculates total duration from modules
 */
export const calculateTotalDuration = (modules: Array<{ estimatedDuration: number }>): number => {
  return modules.reduce((total, module) => total + (module.estimatedDuration || 0), 0);
};