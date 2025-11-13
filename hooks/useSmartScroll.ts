import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage smart auto-scroll behavior in chat interfaces
 * 
 * Features:
 * - Auto-scrolls to bottom when new messages arrive
 * - Detects when user manually scrolls up to read history
 * - Disables auto-scroll when user is reading history
 * - Re-enables auto-scroll when user scrolls back near bottom
 * 
 * @param messages - Array of messages to track for changes
 * @returns Object containing refs and handlers for scroll management
 */
export function useSmartScroll<T>(messages: T[]) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const lastScrollTop = useRef(0);

  /**
   * Detect user manual scroll and update auto-scroll state
   * - If user scrolls up: disable auto-scroll
   * - If user scrolls back to near bottom (within 100px): re-enable auto-scroll
   */
  const handleScroll = useCallback(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    // User scrolled up
    if (scrollTop < lastScrollTop.current) {
      userScrolledRef.current = true;
    }
    
    // User scrolled back to bottom
    if (isNearBottom) {
      userScrolledRef.current = false;
    }
    
    lastScrollTop.current = scrollTop;
  }, []);

  /**
   * Auto-scroll to bottom when messages update
   * Only scrolls if user hasn't manually scrolled up
   */
  useEffect(() => {
    if (!userScrolledRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end' 
      });
    }
  }, [messages]);

  /**
   * Attach scroll event listener to the ScrollArea viewport
   */
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return {
    scrollAreaRef,
    messagesEndRef,
    handleScroll,
  };
}
