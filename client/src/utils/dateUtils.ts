import { format } from 'date-fns';

/**
 * Safely formats a date string or Date object
 * Returns a fallback string if the date is invalid
 */
export const safeFormatDate = (
  dateValue: string | Date | null | undefined,
  formatString: string = 'MMM d, yyyy',
  fallback: string = 'Recently created'
): string => {
  try {
    if (!dateValue) return fallback;
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return fallback;
    
    return format(date, formatString);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return fallback;
  }
};

/**
 * Safely formats a date with a prefix (Created/Updated)
 */
export const safeFormatDateWithPrefix = (
  createdAt: string | Date | null | undefined,
  updatedAt?: string | Date | null | undefined,
  formatString: string = 'MMM d, yyyy',
  fallback: string = 'Recently created'
): string => {
  try {
    const dateToUse = updatedAt || createdAt;
    const prefix = updatedAt ? 'Updated' : 'Created';
    
    if (!dateToUse) return fallback;
    
    const date = new Date(dateToUse);
    if (isNaN(date.getTime())) return fallback;
    
    return `${prefix} ${format(date, formatString)}`;
  } catch (error) {
    console.warn('Date formatting error:', error);
    return fallback;
  }
};

/**
 * Safely formats a timestamp for chat messages
 */
export const safeFormatTimestamp = (
  timestamp: string | Date | null | undefined,
  formatString: string = 'HH:mm'
): string => {
  try {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    return format(date, formatString);
  } catch (error) {
    console.warn('Timestamp formatting error:', error);
    return '';
  }
};