import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Announce a message to screen readers for accessibility
 * Creates a temporary live region that screen readers will announce
 * @param message - The message to announce
 * @param priority - 'polite' (default) or 'assertive' for urgent announcements
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement is made (1 second is enough for screen readers)
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Retry a function with exponential backoff
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param initialDelay - Initial delay in milliseconds (default: 1000)
 * @returns Promise that resolves with the function result or rejects after max retries
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries - 1) {
        break;
      }
      
      // Exponential backoff: delay increases with each attempt
      const delay = initialDelay * Math.pow(2, attempt);
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries exhausted
  throw lastError;
}

/**
 * Convert technical error messages to user-friendly messages
 * @param error - The error object
 * @param language - Language code ('en' or 'hi')
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(
  error: Error | unknown,
  language: string = 'en'
): string {
  const isHindi = language === 'hi';
  
  // Handle null/undefined
  if (!error) {
    return isHindi 
      ? 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।'
      : 'Something went wrong. Please try again.';
  }
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();
  
  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
    return isHindi
      ? 'नेटवर्क कनेक्शन में समस्या है। कृपया अपना इंटरनेट कनेक्शन जांचें।'
      : 'Network connection issue. Please check your internet connection.';
  }
  
  // Timeout errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return isHindi
      ? 'अनुरोध में बहुत समय लग रहा है। कृपया पुनः प्रयास करें।'
      : 'Request is taking too long. Please try again.';
  }
  
  // Authentication errors
  if (lowerMessage.includes('auth') || lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
    return isHindi
      ? 'प्रमाणीकरण में समस्या है। कृपया फिर से लॉगिन करें।'
      : 'Authentication issue. Please log in again.';
  }
  
  // Rate limit errors
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
    return isHindi
      ? 'बहुत सारे अनुरोध। कृपया कुछ समय बाद पुनः प्रयास करें।'
      : 'Too many requests. Please try again in a moment.';
  }
  
  // Server errors
  if (lowerMessage.includes('server') || lowerMessage.includes('500') || lowerMessage.includes('503')) {
    return isHindi
      ? 'सर्वर में समस्या है। कृपया बाद में पुनः प्रयास करें।'
      : 'Server issue. Please try again later.';
  }
  
  // Default generic error
  return isHindi
    ? 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।'
    : 'Something went wrong. Please try again.';
}
