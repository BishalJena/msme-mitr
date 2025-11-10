/**
 * Conversation Storage Service
 *
 * Manages localStorage operations for conversation history with
 * automatic cleanup, size management, and migration support.
 */

import type {
  StoredConversation,
  ConversationMetadata,
  ConversationStorage,
  CreateConversationOptions,
  UpdateConversationOptions,
  StorageResult,
  ConversationFilter,
  StorageStats,
  StoredMessage,
} from '@/types/conversation';
import {
  CONVERSATION_LIMITS,
  TOKEN_ESTIMATION,
  STORAGE_KEYS,
} from '@/types/conversation';

/**
 * Current storage schema version
 */
const STORAGE_VERSION = 1;

/**
 * Generate unique conversation ID
 */
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate conversation title from first user message
 */
function generateTitle(firstMessage?: string): string {
  if (!firstMessage) {
    return `New Chat ${new Date().toLocaleDateString()}`;
  }

  // Clean and truncate message
  const cleaned = firstMessage.replace(/\s+/g, ' ').trim();
  const maxLength = 50;

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Truncate at word boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * Estimate token count for a message (optional, not required for unlimited credits)
 */
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / TOKEN_ESTIMATION.CHARS_PER_TOKEN);
}

/**
 * Calculate total tokens in conversation (optional, returns 0 for unlimited credits)
 */
function calculateConversationTokens(messages: StoredMessage[]): number {
  // Skip token calculation if not needed - user has unlimited credits
  return 0;
}

/**
 * Get conversation storage from localStorage
 */
function getStorage(): ConversationStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!stored) {
      return {
        version: STORAGE_VERSION,
        conversations: [],
        activeConversationId: null,
        lastUpdated: new Date(),
      };
    }

    const parsed = JSON.parse(stored) as ConversationStorage;

    // Convert date strings back to Date objects
    return {
      ...parsed,
      lastUpdated: new Date(parsed.lastUpdated),
      conversations: parsed.conversations.map((conv) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        lastActive: new Date(conv.lastActive),
        messages: conv.messages.map((msg) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
        })),
      })),
    };
  } catch (error) {
    console.error('Failed to load conversation storage:', error);
    return {
      version: STORAGE_VERSION,
      conversations: [],
      activeConversationId: null,
      lastUpdated: new Date(),
    };
  }
}

/**
 * Save conversation storage to localStorage
 */
function saveStorage(storage: ConversationStorage): StorageResult<void> {
  try {
    const toStore = {
      ...storage,
      lastUpdated: new Date(),
    };

    const serialized = JSON.stringify(toStore);

    // Check size limit (5MB)
    const sizeKB = new Blob([serialized]).size / 1024;
    if (sizeKB > CONVERSATION_LIMITS.MAX_STORAGE_SIZE_MB * 1024) {
      return {
        success: false,
        error: `Storage size (${sizeKB.toFixed(0)}KB) exceeds limit of ${CONVERSATION_LIMITS.MAX_STORAGE_SIZE_MB}MB`,
      };
    }

    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, serialized);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to save conversation storage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save storage',
    };
  }
}

/**
 * Create a new conversation
 */
export function createConversation(
  options: CreateConversationOptions = {}
): StorageResult<StoredConversation> {
  try {
    const storage = getStorage();

    // Check conversation limit
    if (storage.conversations.length >= CONVERSATION_LIMITS.MAX_CONVERSATIONS) {
      // Auto-delete oldest non-pinned conversation
      const oldestIndex = storage.conversations
        .map((c, i) => ({ conv: c, index: i }))
        .filter((item) => !item.conv.isPinned)
        .sort((a, b) => a.conv.lastActive.getTime() - b.conv.lastActive.getTime())[0]
        ?.index;

      if (oldestIndex !== undefined) {
        storage.conversations.splice(oldestIndex, 1);
      } else {
        return {
          success: false,
          error: `Cannot create conversation: limit of ${CONVERSATION_LIMITS.MAX_CONVERSATIONS} reached`,
        };
      }
    }

    const now = new Date();
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const newConversation: StoredConversation = {
      id: generateConversationId(),
      title: options.title || 'New Chat',
      messages: [],
      userProfile: options.userProfile,
      sessionId,
      language: options.language || 'en',
      model: options.model || 'openai/gpt-4o-mini',
      createdAt: now,
      lastActive: now,
      messageCount: 0,
      estimatedTokens: 0, // Token counting disabled - unlimited credits
      isArchived: false,
      isPinned: false,
    };

    storage.conversations.unshift(newConversation);
    storage.activeConversationId = newConversation.id;

    // Save sessionId to maintain compatibility
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);

    const saveResult = saveStorage(storage);
    if (!saveResult.success) {
      return saveResult as StorageResult<StoredConversation>;
    }

    return { success: true, data: newConversation };
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create conversation',
    };
  }
}

/**
 * Get conversation by ID
 */
export function getConversation(
  conversationId: string
): StorageResult<StoredConversation> {
  try {
    const storage = getStorage();
    const conversation = storage.conversations.find((c) => c.id === conversationId);

    if (!conversation) {
      return {
        success: false,
        error: `Conversation not found: ${conversationId}`,
      };
    }

    return { success: true, data: conversation };
  } catch (error) {
    console.error('Failed to get conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conversation',
    };
  }
}

/**
 * Get all conversations with optional filtering
 */
export function getAllConversations(
  filter?: ConversationFilter
): StorageResult<StoredConversation[]> {
  try {
    const storage = getStorage();
    let conversations = [...storage.conversations];

    // Apply filters
    if (filter) {
      if (filter.language) {
        conversations = conversations.filter((c) => c.language === filter.language);
      }
      if (filter.isArchived !== undefined) {
        conversations = conversations.filter((c) => c.isArchived === filter.isArchived);
      }
      if (filter.isPinned !== undefined) {
        conversations = conversations.filter((c) => c.isPinned === filter.isPinned);
      }
      if (filter.fromDate) {
        conversations = conversations.filter(
          (c) => c.createdAt >= filter.fromDate!
        );
      }
      if (filter.toDate) {
        conversations = conversations.filter((c) => c.createdAt <= filter.toDate!);
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        conversations = conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(query) ||
            c.messages.some((m) => m.content.toLowerCase().includes(query))
        );
      }
    }

    // Sort: pinned first, then by lastActive
    conversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastActive.getTime() - a.lastActive.getTime();
    });

    return { success: true, data: conversations };
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conversations',
    };
  }
}

/**
 * Get conversation metadata for sidebar
 */
export function getConversationMetadata(): StorageResult<ConversationMetadata[]> {
  try {
    const storage = getStorage();

    const metadata: ConversationMetadata[] = storage.conversations.map((conv) => {
      const lastMessage = conv.messages
        .filter((m) => m.role !== 'system')
        .slice(-1)[0]?.content;

      return {
        id: conv.id,
        title: conv.title,
        lastMessage: lastMessage
          ? lastMessage.substring(0, 100) + (lastMessage.length > 100 ? '...' : '')
          : undefined,
        messageCount: conv.messageCount,
        lastActive: conv.lastActive,
        createdAt: conv.createdAt,
        language: conv.language,
        isPinned: conv.isPinned,
      };
    });

    // Sort: pinned first, then by lastActive
    metadata.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastActive.getTime() - a.lastActive.getTime();
    });

    return { success: true, data: metadata };
  } catch (error) {
    console.error('Failed to get conversation metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metadata',
    };
  }
}

/**
 * Update conversation
 */
export function updateConversation(
  conversationId: string,
  updates: UpdateConversationOptions
): StorageResult<StoredConversation> {
  try {
    const storage = getStorage();
    const index = storage.conversations.findIndex((c) => c.id === conversationId);

    if (index === -1) {
      return {
        success: false,
        error: `Conversation not found: ${conversationId}`,
      };
    }

    storage.conversations[index] = {
      ...storage.conversations[index],
      ...updates,
      lastActive: new Date(),
    };

    const saveResult = saveStorage(storage);
    if (!saveResult.success) {
      return saveResult as StorageResult<StoredConversation>;
    }

    return { success: true, data: storage.conversations[index] };
  } catch (error) {
    console.error('Failed to update conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update conversation',
    };
  }
}

/**
 * Add message to conversation
 */
export function addMessage(
  conversationId: string,
  message: Omit<StoredMessage, 'id' | 'createdAt'>
): StorageResult<StoredConversation> {
  try {
    const storage = getStorage();
    const index = storage.conversations.findIndex((c) => c.id === conversationId);

    if (index === -1) {
      return {
        success: false,
        error: `Conversation not found: ${conversationId}`,
      };
    }

    const conversation = storage.conversations[index];

    // Create new message
    const newMessage: StoredMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date(),
    };

    // Add message
    conversation.messages.push(newMessage);
    conversation.messageCount = conversation.messages.length;
    conversation.estimatedTokens = calculateConversationTokens(conversation.messages);
    conversation.lastActive = new Date();

    // Update title if this is the first user message
    if (
      conversation.messages.length === 1 &&
      message.role === 'user' &&
      conversation.title === 'New Chat'
    ) {
      conversation.title = generateTitle(message.content);
    }

    // Truncate if exceeding limits
    if (
      conversation.messageCount > CONVERSATION_LIMITS.MAX_MESSAGES_PER_CONVERSATION
    ) {
      // Keep first 2 messages (context) + last 40 messages
      const toKeep = conversation.messages.slice(0, 2);
      const recent = conversation.messages.slice(-40);
      conversation.messages = [...toKeep, ...recent];
      conversation.messageCount = conversation.messages.length;
      conversation.estimatedTokens = calculateConversationTokens(conversation.messages);
    }

    const saveResult = saveStorage(storage);
    if (!saveResult.success) {
      return saveResult as StorageResult<StoredConversation>;
    }

    return { success: true, data: conversation };
  } catch (error) {
    console.error('Failed to add message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add message',
    };
  }
}

/**
 * Delete conversation
 */
export function deleteConversation(conversationId: string): StorageResult<void> {
  try {
    const storage = getStorage();
    const index = storage.conversations.findIndex((c) => c.id === conversationId);

    if (index === -1) {
      return {
        success: false,
        error: `Conversation not found: ${conversationId}`,
      };
    }

    storage.conversations.splice(index, 1);

    // If deleting active conversation, set next one as active
    if (storage.activeConversationId === conversationId) {
      storage.activeConversationId =
        storage.conversations.length > 0 ? storage.conversations[0].id : null;
    }

    return saveStorage(storage);
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete conversation',
    };
  }
}

/**
 * Get active conversation ID
 */
export function getActiveConversationId(): string | null {
  try {
    const storage = getStorage();
    return storage.activeConversationId;
  } catch (error) {
    console.error('Failed to get active conversation ID:', error);
    return null;
  }
}

/**
 * Set active conversation
 */
export function setActiveConversation(conversationId: string | null): StorageResult<void> {
  try {
    const storage = getStorage();

    if (conversationId) {
      const exists = storage.conversations.some((c) => c.id === conversationId);
      if (!exists) {
        return {
          success: false,
          error: `Conversation not found: ${conversationId}`,
        };
      }

      // Update lastActive for the conversation
      const index = storage.conversations.findIndex((c) => c.id === conversationId);
      if (index !== -1) {
        storage.conversations[index].lastActive = new Date();
      }
    }

    storage.activeConversationId = conversationId;
    return saveStorage(storage);
  } catch (error) {
    console.error('Failed to set active conversation:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to set active conversation',
    };
  }
}

/**
 * Clean up old conversations
 */
export function cleanupOldConversations(): StorageResult<number> {
  try {
    const storage = getStorage();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CONVERSATION_LIMITS.AUTO_CLEANUP_DAYS);

    const before = storage.conversations.length;

    // Keep pinned conversations regardless of age
    storage.conversations = storage.conversations.filter(
      (c) => c.isPinned || c.lastActive >= cutoffDate
    );

    const deleted = before - storage.conversations.length;

    if (deleted > 0) {
      saveStorage(storage);
    }

    return { success: true, data: deleted };
  } catch (error) {
    console.error('Failed to cleanup conversations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cleanup conversations',
    };
  }
}

/**
 * Get storage statistics
 */
export function getStorageStats(): StorageResult<StorageStats> {
  try {
    const storage = getStorage();

    if (storage.conversations.length === 0) {
      return {
        success: true,
        data: {
          totalConversations: 0,
          totalMessages: 0,
          estimatedSizeKB: 0,
          averageMessagesPerConversation: 0,
        },
      };
    }

    const totalMessages = storage.conversations.reduce(
      (sum, c) => sum + c.messageCount,
      0
    );

    const serialized = JSON.stringify(storage);
    const sizeKB = new Blob([serialized]).size / 1024;

    const dates = storage.conversations.map((c) => c.createdAt);
    const oldest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const newest = new Date(Math.max(...dates.map((d) => d.getTime())));

    return {
      success: true,
      data: {
        totalConversations: storage.conversations.length,
        totalMessages,
        estimatedSizeKB: Math.round(sizeKB),
        oldestConversation: oldest,
        newestConversation: newest,
        averageMessagesPerConversation:
          Math.round(totalMessages / storage.conversations.length) || 0,
      },
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get storage stats',
    };
  }
}

/**
 * Clear all conversations (with confirmation in UI)
 */
export function clearAllConversations(): StorageResult<void> {
  try {
    const storage: ConversationStorage = {
      version: STORAGE_VERSION,
      conversations: [],
      activeConversationId: null,
      lastUpdated: new Date(),
    };

    return saveStorage(storage);
  } catch (error) {
    console.error('Failed to clear conversations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear conversations',
    };
  }
}

/**
 * Export conversation as JSON
 */
export function exportConversation(conversationId: string): StorageResult<string> {
  try {
    const result = getConversation(conversationId);
    if (!result.success) {
      return result as StorageResult<string>;
    }

    const json = JSON.stringify(result.data, null, 2);
    return { success: true, data: json };
  } catch (error) {
    console.error('Failed to export conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export conversation',
    };
  }
}
