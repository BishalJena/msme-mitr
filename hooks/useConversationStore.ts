/**
 * Conversation Store Hook
 *
 * Central state management for chat conversations with automatic
 * persistence to localStorage and integration with AI SDK v5.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage as Message } from '@ai-sdk/react';
import type {
  StoredConversation,
  ConversationMetadata,
  CreateConversationOptions,
  UpdateConversationOptions,
  StoredMessage,
} from '@/types/conversation';
import {
  createConversation,
  getConversation,
  getAllConversations,
  getConversationMetadata,
  updateConversation,
  addMessage as addMessageToStorage,
  deleteConversation as deleteConversationFromStorage,
  getActiveConversationId,
  setActiveConversation as setActiveConversationInStorage,
  cleanupOldConversations,
} from '@/lib/conversationStorage';
import { useTokenCounter, useMessageCounter, getLimitWarningMessage } from './useTokenCounter';
import { toast } from 'sonner';

export interface UseConversationStoreOptions {
  language?: string;
  userProfile?: any;
  onConversationChange?: (conversationId: string | null) => void;
}

export interface ConversationStore {
  // Current conversation
  conversation: StoredConversation | null;
  conversationId: string | null;

  // Messages from AI SDK
  messages: Message[];
  input: string;
  setInput: (input: string) => void;

  // AI SDK status
  isLoading: boolean;
  error: Error | undefined;

  // Conversation list
  conversations: ConversationMetadata[];

  // Actions
  createNewConversation: (options?: CreateConversationOptions) => Promise<string>;
  switchConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  renameConversation: (conversationId: string, title: string) => Promise<void>;

  // Message actions (delegates to AI SDK)
  sendMessage: (text: string) => void;
  stop: () => void;

  // Limits & monitoring
  messageCount: number;
  tokenCount: number;
  isNearLimit: boolean;
  limitWarning: string | null;

  // Utilities
  refreshConversations: () => void;
}

/**
 * Main conversation store hook
 */
export function useConversationStore(
  options: UseConversationStoreOptions = {}
): ConversationStore {
  const { language = 'en', userProfile, onConversationChange } = options;

  // State
  const [conversation, setConversation] = useState<StoredConversation | null>(null);
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [input, setInput] = useState('');

  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isInitializedRef = useRef(false);

  // AI SDK useChat hook
  const {
    messages,
    status,
    error,
    stop,
    setMessages,
    sendMessage: aiSendMessage,
  } = useChat({
    api: '/api/chat',
    body: {
      sessionId: conversation?.sessionId,
      language: conversation?.language || language,
      userProfile: conversation?.userProfile || userProfile,
      model: conversation?.model || 'openai/gpt-4o-mini',
    },
    onFinish: (message: any) => {
      // Save assistant response to storage
      if (conversation) {
        saveMessageDebounced({
          role: 'assistant',
          content: message.content,
        });
      }
    },
    onError: (error: any) => {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
    },
  } as any);

  const isLoading = status === 'submitted';

  // Token and message counting (disabled - unlimited credits)
  const storedMessages: StoredMessage[] = (messages || []).map((msg: any) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content || msg.text || '',
    createdAt: new Date(),
  }));

  // Simplified counting without limits (user has unlimited credits)
  const totalTokens = 0;
  const messageCount = messages.length;
  const isNearLimit = false;
  const limitWarning = null;

  // Token warnings disabled - no longer needed

  /**
   * Load conversations from storage
   */
  const refreshConversations = useCallback(() => {
    const result = getConversationMetadata();
    if (result.success) {
      setConversations(result.data);
    } else {
      console.error('Failed to load conversations:', result.error);
      toast.error('Failed to load conversation history');
    }
  }, []);

  /**
   * Initialize: Load or create conversation
   */
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Cleanup old conversations on mount
    cleanupOldConversations();

    // Load active conversation or create new one
    const activeId = getActiveConversationId();

    if (activeId) {
      const result = getConversation(activeId);
      if (result.success) {
        setConversation(result.data);
        // Convert StoredMessage[] to UIMessage[] format
        const uiMessages = result.data.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        }));
        setMessages(uiMessages as any);
        refreshConversations();
        onConversationChange?.(activeId);
        return;
      }
    }

    // No active conversation - create new one
    const createResult = createConversation({ language, userProfile });
    if (createResult.success) {
      setConversation(createResult.data);
      refreshConversations();
      onConversationChange?.(createResult.data.id);
    } else {
      console.error('Failed to create initial conversation:', createResult.error);
      toast.error('Failed to initialize conversation');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Debounced save to localStorage
   */
  const saveMessageDebounced = useCallback(
    (message: Omit<StoredMessage, 'id' | 'createdAt'>) => {
      if (!conversation) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save by 300ms
      saveTimeoutRef.current = setTimeout(() => {
        const result = addMessageToStorage(conversation.id, message);
        if (result.success) {
          setConversation(result.data);
          refreshConversations();
        } else {
          console.error('Failed to save message:', result.error);
        }
      }, 300);
    },
    [conversation, refreshConversations]
  );

  /**
   * Sync messages to storage when they change
   */
  useEffect(() => {
    if (!conversation || messages.length === 0) return;

    // Only sync if there are new messages not in storage
    const storageMessageIds = new Set(conversation.messages.map((m) => m.id));
    const newMessages = messages.filter((m) => !storageMessageIds.has(m.id));

    if (newMessages.length > 0) {
      // Get the last message (most recent)
      const lastMessage = newMessages[newMessages.length - 1] as any;

      // Save to storage
      saveMessageDebounced({
        role: lastMessage.role as 'user' | 'assistant',
        content: lastMessage.content || lastMessage.text || '',
      });
    }
  }, [messages, conversation, saveMessageDebounced]);

  /**
   * Save on unmount or visibility change
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Force immediate save when tab is hidden
        if (conversation && messages.length > 0) {
          const lastMessage = messages[messages.length - 1] as any;
          addMessageToStorage(conversation.id, {
            role: lastMessage.role as 'user' | 'assistant',
            content: lastMessage.content || lastMessage.text || '',
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [conversation, messages]);

  /**
   * Create new conversation
   */
  const createNewConversation = useCallback(
    async (createOptions?: CreateConversationOptions): Promise<string> => {
      const result = createConversation({
        language,
        userProfile,
        ...createOptions,
      });

      if (result.success) {
        setConversation(result.data);
        setMessages([]);
        setInput('');
        refreshConversations();
        onConversationChange?.(result.data.id);
        toast.success('New conversation started');
        return result.data.id;
      } else {
        console.error('Failed to create conversation:', result.error);
        toast.error(result.error);
        throw new Error(result.error);
      }
    },
    [language, userProfile, setMessages, refreshConversations, onConversationChange]
  );

  /**
   * Switch to different conversation
   */
  const switchConversation = useCallback(
    async (conversationId: string): Promise<void> => {
      if (conversation?.id === conversationId) return;

      const result = getConversation(conversationId);
      if (result.success) {
        setConversation(result.data);
        // Convert StoredMessage[] to UIMessage[] format
        const uiMessages = result.data.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        }));
        setMessages(uiMessages as any);
        setInput('');

        const setActiveResult = setActiveConversationInStorage(conversationId);
        if (!setActiveResult.success) {
          console.error('Failed to set active conversation:', setActiveResult.error);
        }

        refreshConversations();
        onConversationChange?.(conversationId);
      } else {
        console.error('Failed to switch conversation:', result.error);
        toast.error('Failed to load conversation');
      }
    },
    [conversation, setMessages, refreshConversations, onConversationChange]
  );

  /**
   * Delete conversation
   */
  const deleteConversation = useCallback(
    async (conversationId: string): Promise<void> => {
      const result = deleteConversationFromStorage(conversationId);

      if (result.success) {
        refreshConversations();

        // If deleting current conversation, create new one
        if (conversation?.id === conversationId) {
          await createNewConversation();
        }

        toast.success('Conversation deleted');
      } else {
        console.error('Failed to delete conversation:', result.error);
        toast.error('Failed to delete conversation');
      }
    },
    [conversation, refreshConversations, createNewConversation]
  );

  /**
   * Rename conversation
   */
  const renameConversation = useCallback(
    async (conversationId: string, title: string): Promise<void> => {
      const result = updateConversation(conversationId, { title });

      if (result.success) {
        if (conversation?.id === conversationId) {
          setConversation(result.data);
        }
        refreshConversations();
        toast.success('Conversation renamed');
      } else {
        console.error('Failed to rename conversation:', result.error);
        toast.error('Failed to rename conversation');
      }
    },
    [conversation, refreshConversations]
  );

  /**
   * Enhanced send message with persistence
   */
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !conversation) return;

      // Save user message to storage immediately
      addMessageToStorage(conversation.id, {
        role: 'user',
        content: text,
      });

      // Send to AI via AI SDK
      aiSendMessage({ text });
      setInput('');
    },
    [conversation, aiSendMessage]
  );

  return {
    // Current conversation
    conversation,
    conversationId: conversation?.id || null,

    // Messages
    messages,
    input,
    setInput,

    // Status
    isLoading,
    error,

    // Conversation list
    conversations,

    // Actions
    createNewConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
    stop,

    // Limits
    messageCount,
    tokenCount: totalTokens,
    isNearLimit,
    limitWarning,

    // Utilities
    refreshConversations,
  };
}
