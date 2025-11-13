/**
 * Conversation Transition Hook
 * 
 * Manages smooth transitions when switching between conversations with:
 * - Loading states with minimum display time
 * - Transition animations
 * - Error handling with retry
 * - Scroll position reset
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export type TransitionState = 
  | 'idle'
  | 'loading'
  | 'transitioning'
  | 'error';

export interface ConversationTransitionOptions {
  minLoadingTime?: number;  // Minimum time to show loading state (default: 100ms)
  transitionDelay?: number; // Delay for smooth animation (default: 200ms)
  onTransitionStart?: () => void;
  onTransitionComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface ConversationTransitionResult {
  transitionState: TransitionState;
  targetConversationId: string | null;
  error: Error | null;
  switchConversation: (
    conversationId: string,
    loadFn: () => Promise<void>
  ) => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for managing smooth conversation transitions
 */
export function useConversationTransition(
  options: ConversationTransitionOptions = {}
): ConversationTransitionResult {
  const {
    minLoadingTime = 100,
    transitionDelay = 200,
    onTransitionStart,
    onTransitionComplete,
    onError,
  } = options;

  const [transitionState, setTransitionState] = useState<TransitionState>('idle');
  const [targetConversationId, setTargetConversationId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Store the last load function for retry
  const lastLoadFnRef = useRef<(() => Promise<void>) | null>(null);
  const lastConversationIdRef = useRef<string | null>(null);

  /**
   * Switch to a different conversation with smooth transition
   */
  const switchConversation = useCallback(
    async (conversationId: string, loadFn: () => Promise<void>) => {
      // Don't switch if already in progress
      if (transitionState === 'loading' || transitionState === 'transitioning') {
        return;
      }

      try {
        // Store for retry
        lastLoadFnRef.current = loadFn;
        lastConversationIdRef.current = conversationId;

        // Start transition
        setTransitionState('loading');
        setTargetConversationId(conversationId);
        setError(null);
        onTransitionStart?.();

        // Start loading messages in background
        const loadStartTime = Date.now();
        const messagesPromise = loadFn();

        // Wait for both loading to complete AND minimum loading time
        await Promise.all([
          messagesPromise,
          new Promise(resolve => setTimeout(resolve, minLoadingTime))
        ]);

        // Enter transitioning state
        setTransitionState('transitioning');

        // Wait for transition animation
        await new Promise(resolve => setTimeout(resolve, transitionDelay));

        // Complete transition
        setTransitionState('idle');
        setTargetConversationId(null);
        onTransitionComplete?.();

      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load conversation');
        console.error('Conversation transition error:', error);
        
        setTransitionState('error');
        setError(error);
        onError?.(error);
        
        toast.error('Failed to load conversation');
      }
    },
    [transitionState, minLoadingTime, transitionDelay, onTransitionStart, onTransitionComplete, onError]
  );

  /**
   * Retry the last failed transition
   */
  const retry = useCallback(async () => {
    if (lastLoadFnRef.current && lastConversationIdRef.current) {
      await switchConversation(lastConversationIdRef.current, lastLoadFnRef.current);
    }
  }, [switchConversation]);

  /**
   * Reset transition state
   */
  const reset = useCallback(() => {
    setTransitionState('idle');
    setTargetConversationId(null);
    setError(null);
    lastLoadFnRef.current = null;
    lastConversationIdRef.current = null;
  }, []);

  return {
    transitionState,
    targetConversationId,
    error,
    switchConversation,
    retry,
    reset,
  };
}
