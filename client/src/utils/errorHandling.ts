/**
 * Utility functions for handling errors and network issues
 */

export interface NetworkErrorInfo {
  isNetworkError: boolean;
  shouldRetry: boolean;
  userMessage: string;
  shouldCloseModal: boolean;
}

/**
 * Analyzes an error and provides guidance on how to handle it
 */
export function analyzeError(error: any): NetworkErrorInfo {
  const isNetworkError = error.code === 'ERR_NETWORK' || 
                        error.message === 'Network Error' ||
                        error.name === 'NetworkError';
  
  const isTimeoutError = error.code === 'ECONNABORTED' || 
                        error.message?.includes('timeout') ||
                        error.message?.includes('Request timed out');
  
  const isServerError = error.response?.status >= 500;
  
  if (isNetworkError) {
    return {
      isNetworkError: true,
      shouldRetry: true,
      userMessage: 'Network connection issue. The operation may have completed successfully. Please check your results or try again.',
      shouldCloseModal: true // Close modal for network errors as operation might have succeeded
    };
  }
  
  if (isTimeoutError) {
    return {
      isNetworkError: false,
      shouldRetry: true,
      userMessage: 'The operation is taking longer than expected. The process may still be running in the background.',
      shouldCloseModal: true // Close modal for timeout errors as operation might still succeed
    };
  }
  
  if (isServerError) {
    return {
      isNetworkError: false,
      shouldRetry: true,
      userMessage: 'Server error occurred. Please try again in a moment.',
      shouldCloseModal: false
    };
  }
  
  // Client error or unknown error
  return {
    isNetworkError: false,
    shouldRetry: false,
    userMessage: error.response?.data?.message || error.message || 'An unexpected error occurred.',
    shouldCloseModal: false
  };
}

/**
 * Waits for a specified time and then checks if a resource was created
 */
export async function waitAndCheck<T>(
  checkFunction: () => Promise<T>,
  predicate: (result: T) => boolean,
  maxAttempts: number = 5,
  delayMs: number = 2000
): Promise<T | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      const result = await checkFunction();
      if (predicate(result)) {
        return result;
      }
    } catch (error) {
      console.warn(`Attempt ${attempt + 1} failed:`, error);
    }
  }
  return null;
}

/**
 * Checks if a learning path was created despite network errors
 */
export async function checkForCreatedPath(
  subject: string,
  existingPaths: any[],
  getLearningPaths: () => Promise<{ learningPaths: any[] }>
): Promise<any | null> {
  return waitAndCheck(
    async () => {
      const { learningPaths } = await getLearningPaths();
      return learningPaths;
    },
    (paths) => {
      return paths.some(path => 
        path.subject.toLowerCase() === subject.toLowerCase() && 
        !existingPaths.some(existing => existing.id === path.id)
      );
    },
    3, // 3 attempts
    2000 // 2 second delay
  );
}