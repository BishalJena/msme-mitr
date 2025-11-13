/**
 * Conversation History & State Management Types
 *
 * Defines the structure for storing and managing chat conversations
 * in localStorage with support for user profiles and session management.
 */

import { UserProfile } from './scheme';
import type { Conversation } from './database';
import type { UIMessage as Message } from '@ai-sdk/react';

/**
 * Message format compatible with AI SDK v5
 */
export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  // AI SDK v5 format support
  parts?: Array<{
    type: string;
    text: string;
  }>;
}

/**
 * Complete conversation with full message history
 */
export interface StoredConversation {
  id: string;
  title: string;
  messages: StoredMessage[];
  userProfile?: UserProfile;
  sessionId: string;
  language: string;
  model: string;
  createdAt: Date;
  lastActive: Date;
  messageCount: number;
  estimatedTokens: number;
  // Metadata for UI
  isArchived?: boolean;
  isPinned?: boolean;
}

/**
 * Lightweight conversation metadata for sidebar display
 */
export interface ConversationMetadata {
  id: string;
  title: string;
  lastMessage?: string;
  messageCount: number;
  lastActive: Date;
  createdAt: Date;
  language: string;
  isPinned?: boolean;
}

/**
 * Storage schema with versioning for migrations
 */
export interface ConversationStorage {
  version: number; // Current: 1
  conversations: StoredConversation[];
  activeConversationId: string | null;
  lastUpdated: Date;
}

/**
 * Conversation limits and constraints
 */
export const CONVERSATION_LIMITS = {
  MAX_CONVERSATIONS: 50,
  MAX_MESSAGES_PER_CONVERSATION: 50,
  MAX_TOKENS_PER_CONVERSATION: 8000,
  WARNING_MESSAGE_THRESHOLD: 40,
  WARNING_TOKEN_THRESHOLD: 7000,
  MAX_STORAGE_SIZE_MB: 5,
  AUTO_CLEANUP_DAYS: 30,
} as const;

/**
 * Token estimation constants (rough approximation)
 */
export const TOKEN_ESTIMATION = {
  CHARS_PER_TOKEN: 4,
  SYSTEM_MESSAGE_TOKENS: 500, // Approximate system prompt size
} as const;

/**
 * Storage keys for localStorage
 */
export const STORAGE_KEYS = {
  CONVERSATIONS: 'msme_conversations',
  ACTIVE_CONVERSATION: 'msme_active_conversation',
  USER_PROFILE: 'msme_user_profile',
  SESSION_ID: 'chatSessionId', // Keep existing key for compatibility
} as const;

/**
 * Conversation creation options
 */
export interface CreateConversationOptions {
  language?: string;
  model?: string;
  userProfile?: UserProfile;
  title?: string;
}

/**
 * Conversation update options
 */
export interface UpdateConversationOptions {
  title?: string;
  userProfile?: UserProfile;
  isPinned?: boolean;
  isArchived?: boolean;
}

/**
 * Result type for storage operations
 */
export type StorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Conversation filter options
 */
export interface ConversationFilter {
  language?: string;
  isArchived?: boolean;
  isPinned?: boolean;
  fromDate?: Date;
  toDate?: Date;
  searchQuery?: string;
}

/**
 * Storage statistics for monitoring
 */
export interface StorageStats {
  totalConversations: number;
  totalMessages: number;
  estimatedSizeKB: number;
  oldestConversation?: Date;
  newestConversation?: Date;
  averageMessagesPerConversation: number;
}

// ============================================================================
// Lazy Conversation Creation Types
// ============================================================================

/**
 * Temporary conversation stored in-memory before persistence
 * Used to prevent empty conversations from cluttering the database
 */
export interface TempConversation {
  id: string;              // Temporary UUID (prefixed with 'temp_')
  title: string;           // Default: "New Chat"
  messages: any[];         // In-memory messages (AI SDK UIMessage format)
  createdAt: Date;
  language: string;
  model: string;
}

/**
 * Union type representing the state of a conversation
 * - temporary: In-memory only, not yet persisted to database
 * - persisted: Saved to database with a real ID
 * - null: No active conversation
 */
export type ConversationState = 
  | { type: 'temporary'; data: TempConversation }
  | { type: 'persisted'; data: Conversation }
  | null;
