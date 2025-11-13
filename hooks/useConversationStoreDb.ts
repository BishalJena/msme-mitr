/**
 * Database-backed Conversation Store Hook
 *
 * Central state management for chat conversations with automatic
 * persistence to Supabase database and integration with AI SDK v5.
 * 
 * This replaces the localStorage-based useConversationStore with
 * database persistence.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage as Message } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from './useConversations';
import { useMessages } from './useMessages';
import type { Conversation } from '@/types/database';
import type { TempConversation, ConversationState } from '@/types/conversation';
import { toast } from 'sonner';

export interface UseConversationStoreDbOptions {
  language?: string;
  userProfile?: any;
  onConversationChange?: (conversationId: string | null) => void;
}

export interface ConversationStoreDb {
  // Current conversation state (temporary or persisted)
  conversationState: ConversationState;
  conversation: Conversation | null;
  conversationId: string | null;

  // Messages from AI SDK
  messages: Message[];
  input: string;
  setInput: (input: string) => void;

  // AI SDK status
  isLoading: boolean;
  error: Error | undefined;

  // Conversation list (only persisted conversations)
  conversations: Conversation[];
  conversationsLoading: boolean;

  // Actions
  createNewConversation: (title?: string) => Promise<string | null>;
  switchConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  renameConversation: (conversationId: string, title: string) => Promise<void>;

  // Message actions (delegates to AI SDK)
  sendMessage: (text: string) => void;
  stop: () => void;

  // Utilities
  refreshConversations: () => Promise<void>;
}

/**
 * Database-backed conversation store hook
 */
export function useConversationStoreDb(
  options: UseConversationStoreDbOptions = {}
): ConversationStoreDb {
  const { language = 'en', userProfile, onConversationChange } = options;
  const { user } = useAuth();

  // State - using ConversationState union type for lazy persistence
  const [conversationState, setConversationState] = useState<ConversationState>(null);
  const [input, setInput] = useState('');

  // Refs
  const isInitializedRef = useRef(false);
  const isSendingRef = useRef(false);
  const lastConversationIdRef = useRef<string | null>(null);

  // Database hooks
  const {
    conversations,
    loading: conversationsLoading,
    createConversation,
    deleteConversation: deleteConversationDb,
    updateConversation,
    refresh: refreshConversations,
  } = useConversations();

  // Get current conversation ID (null for temporary conversations)
  const currentConversationId = 
    conversationState?.type === 'persisted' ? conversationState.data.id : null;

  const {
    messages: dbMessages,
    loading: messagesLoading,
    addMessage,
    refresh: refreshMessages,
  } = useMessages(currentConversationId || undefined);

  // Get current conversation (null for temporary conversations)
  const conversation =
    conversationState?.type === 'persisted' ? conversationState.data : null;

  /**
   * Helper to extract text from AI SDK v5 message
   * Not needed anymore since messageService handles all conversions
   */
  const getMessageText = useCallback((message: any): string => {
    // Direct string content (most common)
    if (typeof message.content === 'string' && message.content) {
      return message.content;
    }

    // Text field (fallback)
    if (typeof message.text === 'string' && message.text) {
      return message.text;
    }

    // Parts array (AI SDK v5 format)
    if (message.parts && Array.isArray(message.parts)) {
      const text = message.parts
        .filter((part: any) => part && (part.type === 'text' || part.text))
        .map((part: any) => part.text || '')
        .filter(Boolean)
        .join('');
      if (text) return text;
    }

    // Content array format
    if (message.content && Array.isArray(message.content)) {
      const text = message.content
        .filter((c: any) => c && (c.type === 'text' || c.type === 'output_text' || c.type === 'input_text'))
        .map((c: any) => c.text || c.content || '')
        .filter(Boolean)
        .join('');
      if (text) return text;
    }

    return '';
  }, []);

  // Convert database messages to display format - stabilize reference
  const displayMessages = React.useMemo(() => {
    if (conversationState?.type === 'persisted' && dbMessages.length > 0) {
      return dbMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: new Date(msg.created_at),
      }));
    }
    return [];
  }, [conversationState?.type, dbMessages.length, dbMessages]);

  // AI SDK useChat hook - start fresh each time, don't pass initial messages
  // The API will load conversation history from the database when conversationId is provided
  const {
    messages: aiMessages,
    status,
    error,
    stop,
    sendMessage: aiSendMessage,
  } = useChat({
    id: currentConversationId || `temp-${Date.now()}`, // Always provide an ID
    api: '/api/chat',
    body: {
      conversationId: currentConversationId,
      language: conversationState?.data.language || language,
      userProfile: conversation?.user_id ? userProfile : undefined,
      model: conversationState?.data.model || 'openai/gpt-4o-mini',
    },
    // Don't pass initialMessages - let the API load them from database
    // This prevents validation errors from mismatched message formats
    onFinish: async ({ message, messages }: { message: any; messages: any[] }) => {
      console.log('[onFinish] Called');
      console.log('[onFinish] Current conversation ID:', currentConversationId);
      console.log('[onFinish] Message count:', messages?.length);
      console.log('[onFinish] Full message object:', JSON.stringify(message, null, 2));
      console.log('[onFinish] Last message from array:', messages?.length > 0 ? JSON.stringify(messages[messages.length - 1], null, 2) : 'No messages');
      
      // Save assistant response to database (only for persisted conversations)
      if (currentConversationId) {
        try {
          // Extract text content from AI SDK v5 UIMessage format
          let content = '';
          
          console.log('[onFinish] Message structure:', {
            hasParts: !!message.parts,
            hasContent: !!message.content,
            hasText: !!message.text,
            partsLength: message.parts?.length,
            messageKeys: Object.keys(message || {}),
          });
          
          // Method 1: AI SDK v5 UIMessage uses parts array
          if (message.parts && Array.isArray(message.parts)) {
            console.log('[onFinish] Parts array:', JSON.stringify(message.parts, null, 2));
            content = message.parts
              .filter((p: any) => p && p.type === 'text')
              .map((p: any) => p.text || '')
              .join('')
              .trim();
          }
          
          // Method 2: Check if content is an array of parts
          if (!content && message.content && Array.isArray(message.content)) {
            console.log('[onFinish] Content is array:', JSON.stringify(message.content, null, 2));
            content = message.content
              .filter((c: any) => c && c.type === 'text')
              .map((c: any) => c.text || '')
              .join('')
              .trim();
          }
          
          // Method 3: Direct string content
          if (!content && typeof message.content === 'string') {
            content = message.content;
          }
          
          // Method 4: Text field
          if (!content && typeof message.text === 'string') {
            content = message.text;
          }
          
          // Method 5: Try to use the helper function
          if (!content) {
            content = getMessageText(message);
          }
          
          // Method 6: Try to get from messages array (last assistant message)
          if (!content && messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              console.log('[onFinish] Trying to extract from messages array');
              content = getMessageText(lastMessage);
            }
          }

          console.log('[onFinish] Extracted content length:', content?.length);
          console.log('[onFinish] Extracted content preview:', content?.substring(0, 100));

          if (content && content.trim().length > 0) {
            console.log('[onFinish] Saving assistant message to database...');
            await addMessage({
              role: 'assistant',
              content: content,
            });
            console.log('[onFinish] Assistant message saved successfully!');
            
            // Refresh messages to show the saved response
            await refreshMessages();
          } else {
            console.error('[onFinish] No content extracted from message!');
            console.error('[onFinish] Message dump:', JSON.stringify(message, null, 2));
            console.error('[onFinish] All message properties:', Object.keys(message));
            
            // Try one more time with a more aggressive extraction
            const fallbackContent = JSON.stringify(message);
            if (fallbackContent && fallbackContent.length > 2) {
              console.warn('[onFinish] Using fallback: stringified message');
            }
          }
        } catch (err) {
          console.error('[onFinish] Failed to save assistant message:', err);
        }
      } else {
        console.warn('[onFinish] No conversation ID - cannot save message');
      }
    },
    onError: (error: any) => {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
    },
  } as any);

  const isLoading = status === 'submitted';

  // Combine database messages with any streaming AI messages
  const messages: Message[] = React.useMemo(() => {
    // Convert display messages to UIMessage format
    const uiDisplayMessages: Message[] = displayMessages.map(msg => ({
      id: msg.id,
      role: msg.role,
      parts: [{ type: 'text' as const, text: msg.content }],
      createdAt: msg.createdAt,
    }));

    // If AI is currently responding, append only the streaming message
    // Filter out any AI messages that are already in the database
    if (aiMessages.length > 0 && isLoading) {
      const dbMessageIds = new Set(uiDisplayMessages.map(m => m.id));
      const newAiMessages = aiMessages.filter(msg => !dbMessageIds.has(msg.id));
      return [...uiDisplayMessages, ...newAiMessages];
    }
    // Otherwise just show database messages
    return uiDisplayMessages;
  }, [displayMessages, aiMessages, isLoading]);

  // Note: Messages are now passed directly to useChat via the 'messages' prop
  // instead of using setMessages in a useEffect. This prevents validation errors.

  /**
   * Generate a concise title from user's first message
   */
  const generateTitle = useCallback((messageText: string): string => {
    const cleaned = messageText.trim();
    
    // Short message - use as-is
    if (cleaned.length <= 30) {
      return cleaned;
    }
    
    // Medium message - use first sentence
    if (cleaned.length <= 50) {
      const firstSentence = cleaned.split(/[.!?]/)[0];
      return firstSentence.length > 0 ? firstSentence : cleaned.slice(0, 50);
    }
    
    // Long message - extract key phrase
    // Remove common question words and get core topic
    const withoutQuestionWords = cleaned
      .replace(/^(what|how|when|where|why|who|can|could|would|should|is|are|do|does)\s+/i, '');
    
    // Take first meaningful chunk
    const words = withoutQuestionWords.split(' ');
    const title = words.slice(0, 6).join(' ');
    
    return title.length > 50 ? title.slice(0, 47) + '...' : title;
  }, []);

  /**
   * Create temporary conversation (in-memory only, not persisted)
   */
  const createTempConversation = useCallback(() => {
    const tempConv: TempConversation = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      language: language,
      model: 'openai/gpt-4o-mini',
    };
    
    setConversationState({ type: 'temporary', data: tempConv });
    setInput('');
    onConversationChange?.(null); // No DB ID yet
  }, [language, onConversationChange]);

  /**
   * Persist temporary conversation to database with first message
   */
  const persistConversation = useCallback(
    async (tempConv: TempConversation, firstMessage: any): Promise<string | null> => {
      if (!user) {
        toast.error('You must be logged in to save conversations');
        return null;
      }

      try {
        // Extract text from message
        const messageText = getMessageText(firstMessage);
        
        // Generate title from first message
        const title = generateTitle(messageText);
        
        // Create conversation in database
        const dbConversation = await createConversation(
          title,
          tempConv.language,
          tempConv.model
        );
        
        if (dbConversation) {
          // Save the first message to the database
          const { MessageService } = await import('@/services/database/messageService');
          const messageService = new MessageService();
          
          await messageService.addMessage(
            dbConversation.id,
            'user',
            messageText
          );
          
          // Update state to persisted
          setConversationState({ 
            type: 'persisted', 
            data: dbConversation 
          });
          
          onConversationChange?.(dbConversation.id);
          
          // Refresh conversations list to show new conversation
          await refreshConversations();
          
          return dbConversation.id;
        }
        return null;
      } catch (err) {
        console.error('Failed to persist conversation:', err);
        toast.error('Failed to save conversation');
        return null;
      }
    },
    [user, getMessageText, generateTitle, createConversation, onConversationChange, refreshConversations]
  );

  /**
   * Create new conversation (persisted immediately)
   * This is kept for backward compatibility and explicit conversation creation
   */
  const createNewConversation = useCallback(
    async (title?: string): Promise<string | null> => {
      if (!user) {
        toast.error('You must be logged in to create a conversation');
        return null;
      }

      try {
        console.log('[createNewConversation] Starting - user:', user?.id, 'title:', title);
        const newConversation = await createConversation(
          title || 'New Chat',
          language,
          'openai/gpt-4o-mini'
        );

        console.log('[createNewConversation] Result:', newConversation);

        if (newConversation && newConversation.id) {
          console.log('[createNewConversation] Setting state with conversation ID:', newConversation.id);
          
          // Verify the conversation actually exists in the database
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: verify, error: verifyErr } = await supabase
            .from('conversations')
            .select('id, title, user_id')
            .eq('id', newConversation.id)
            .maybeSingle();
          
          console.log('[createNewConversation] Verification:', { verify, verifyErr });
          
          if (!verify) {
            console.error('[createNewConversation] CONVERSATION NOT IN DATABASE!');
            toast.error('Failed to create conversation in database');
            return null;
          }
          
          // Clear input before switching
          setInput('');
          
          // Set the new conversation as active
          // The useChat hook will automatically reset based on the new id
          setConversationState({ 
            type: 'persisted', 
            data: newConversation 
          });
          
          // Notify parent component of conversation change
          onConversationChange?.(newConversation.id);
          
          // Refresh conversations list to ensure it's in sync
          await refreshConversations();
          
          console.log('[createNewConversation] SUCCESS - Returning ID:', newConversation.id);
          return newConversation.id;
        }
        console.error('[createNewConversation] FAILED - No conversation returned');
        toast.error('Failed to create conversation');
        return null;
      } catch (err) {
        console.error('[createNewConversation] ERROR:', err);
        toast.error('Error creating conversation');
        return null;
      }
    },
    [user, createConversation, language, onConversationChange, refreshConversations]
  );

  /**
   * Initialize: Ensure we always have an active conversation
   * Only runs once on mount to prevent re-initialization on window focus
   */
  useEffect(() => {
    // Skip if already initialized or still loading
    if (isInitializedRef.current || !user || conversationsLoading) return;

    // Mark as initialized immediately to prevent duplicate runs
    isInitializedRef.current = true;

    // If we have conversations but no active one, switch to the most recent
    if (conversations.length > 0 && !conversationState) {
      const mostRecent = conversations[0]; // Already sorted by last_active_at DESC
      setConversationState({
        type: 'persisted',
        data: mostRecent
      });
      onConversationChange?.(mostRecent.id);
      return;
    }

    // If no conversations exist and no active conversation, create one
    if (conversations.length === 0 && !conversationState) {
      createNewConversation('New Chat');
    }
  }, [user, conversations, conversationsLoading, conversationState, createNewConversation, onConversationChange]);

  /**
   * Switch to different conversation
   */
  const switchConversation = useCallback(
    async (conversationId: string): Promise<void> => {
      if (currentConversationId === conversationId) return;

      // Find the conversation in the list
      const targetConversation = conversations.find(c => c.id === conversationId);
      
      if (targetConversation) {
        // Clear input before switching
        setInput('');
        
        // Set the new conversation as active
        // The useChat hook will automatically reload messages based on the new id
        setConversationState({ 
          type: 'persisted', 
          data: targetConversation 
        });
        
        // Track the last conversation ID to prevent unnecessary reloads
        lastConversationIdRef.current = conversationId;
        
        // Notify parent component of conversation change
        onConversationChange?.(conversationId);
      }
    },
    [currentConversationId, conversations, onConversationChange]
  );

  /**
   * Delete conversation
   */
  const deleteConversation = useCallback(
    async (conversationId: string): Promise<void> => {
      const success = await deleteConversationDb(conversationId);

      if (success) {
        // If deleting current conversation, create a new persisted one
        if (currentConversationId === conversationId) {
          await createNewConversation('New Chat');
        }
      }
    },
    [currentConversationId, deleteConversationDb, createNewConversation]
  );

  /**
   * Rename conversation
   */
  const renameConversation = useCallback(
    async (conversationId: string, title: string): Promise<void> => {
      await updateConversation(conversationId, { title });
    },
    [updateConversation]
  );

  /**
   * Send message - saves to DB and sends to AI
   */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !user) return;

      try {
        isSendingRef.current = true;

        // Ensure we have a persisted conversation - create one if needed
        let activeConversationId = currentConversationId;
        
        console.log('[sendMessage] Current state:', {
          conversationState: conversationState?.type,
          currentConversationId,
          text: text.substring(0, 50)
        });
        
        if (!conversationState || conversationState.type !== 'persisted') {
          console.log('[sendMessage] No persisted conversation - creating new one');
          // Create conversation with title from first message
          const title = generateTitle(text);
          const newConvId = await createNewConversation(title);

          console.log('[sendMessage] New conversation created with ID:', newConvId);

          if (!newConvId) {
            console.error('[sendMessage] FAILED to create conversation');
            toast.error('Failed to create conversation');
            isSendingRef.current = false;
            return;
          }

          activeConversationId = newConvId;
        }

        // Verify conversation exists before adding message
        if (!activeConversationId) {
          console.error('[sendMessage] No active conversation ID!');
          toast.error('No active conversation');
          isSendingRef.current = false;
          return;
        }

        console.log('[sendMessage] About to add message to conversation:', activeConversationId);

        // Clear input immediately for better UX
        setInput('');

        // Save user message to database using the service directly
        // This ensures we use the correct conversation ID
        const { MessageService } = await import('@/services/database/messageService');
        const messageService = new MessageService();
        
        console.log('[sendMessage] Calling messageService.addMessage with ID:', activeConversationId);
        await messageService.addMessage(
          activeConversationId,
          'user',
          text
        );
        console.log('[sendMessage] Message added successfully!');

        // Refresh messages to show the user message immediately
        await refreshMessages();

        // Send to AI via AI SDK
        aiSendMessage({ text });
      } catch (err) {
        console.error('Failed to send message:', err);
        toast.error('Failed to send message');
      } finally {
        isSendingRef.current = false;
      }
    },
    [conversationState, currentConversationId, user, aiSendMessage, createNewConversation, generateTitle, refreshMessages]
  );

  return {
    // Current conversation state
    conversationState,
    conversation,
    conversationId: currentConversationId,

    // Messages
    messages,
    input,
    setInput,

    // Status
    isLoading,
    error,

    // Conversation list (only persisted conversations)
    conversations,
    conversationsLoading,

    // Actions
    createNewConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
    stop,

    // Utilities
    refreshConversations,
  };
}
