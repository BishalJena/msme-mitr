/**
 * Token Counter Hook
 *
 * Provides real-time token estimation for conversations
 * to help manage context limits and warn users.
 */

import { useMemo } from 'react';
import type { StoredMessage } from '@/types/conversation';
import {
  TOKEN_ESTIMATION,
  CONVERSATION_LIMITS,
} from '@/types/conversation';

export interface TokenCount {
  messageTokens: number;
  systemTokens: number;
  totalTokens: number;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
}

export interface TokenCounterOptions {
  includeSystemPrompt?: boolean;
  customLimit?: number;
}

/**
 * Estimate tokens for a single message
 */
function estimateMessageTokens(content: string): number {
  if (!content) return 0;
  return Math.ceil(content.length / TOKEN_ESTIMATION.CHARS_PER_TOKEN);
}

/**
 * Hook to calculate token usage for messages
 */
export function useTokenCounter(
  messages: StoredMessage[],
  options: TokenCounterOptions = {}
): TokenCount {
  const {
    includeSystemPrompt = true,
    customLimit = CONVERSATION_LIMITS.MAX_TOKENS_PER_CONVERSATION,
  } = options;

  const tokenCount = useMemo(() => {
    // Calculate tokens for all messages
    const messageTokens = messages.reduce((sum, msg) => {
      return sum + estimateMessageTokens(msg.content);
    }, 0);

    // Add system prompt tokens
    const systemTokens = includeSystemPrompt
      ? TOKEN_ESTIMATION.SYSTEM_MESSAGE_TOKENS
      : 0;

    const totalTokens = messageTokens + systemTokens;

    // Calculate percentage of limit
    const percentage = Math.min(100, Math.round((totalTokens / customLimit) * 100));

    // Determine warning states
    const isNearLimit =
      totalTokens >= CONVERSATION_LIMITS.WARNING_TOKEN_THRESHOLD;
    const isAtLimit = totalTokens >= customLimit;

    return {
      messageTokens,
      systemTokens,
      totalTokens,
      percentage,
      isNearLimit,
      isAtLimit,
    };
  }, [messages, includeSystemPrompt, customLimit]);

  return tokenCount;
}

/**
 * Hook to check message count limits
 */
export function useMessageCounter(messages: StoredMessage[]) {
  return useMemo(() => {
    const messageCount = messages.length;
    const limit = CONVERSATION_LIMITS.MAX_MESSAGES_PER_CONVERSATION;
    const warningThreshold = CONVERSATION_LIMITS.WARNING_MESSAGE_THRESHOLD;

    const percentage = Math.min(100, Math.round((messageCount / limit) * 100));
    const isNearLimit = messageCount >= warningThreshold;
    const isAtLimit = messageCount >= limit;
    const remaining = Math.max(0, limit - messageCount);

    return {
      messageCount,
      limit,
      percentage,
      isNearLimit,
      isAtLimit,
      remaining,
    };
  }, [messages]);
}

/**
 * Get user-friendly limit warning message
 */
export function getLimitWarningMessage(
  messageCount: number,
  tokenCount: number
): string | null {
  const messageThreshold = CONVERSATION_LIMITS.WARNING_MESSAGE_THRESHOLD;
  const messageLimit = CONVERSATION_LIMITS.MAX_MESSAGES_PER_CONVERSATION;
  const tokenThreshold = CONVERSATION_LIMITS.WARNING_TOKEN_THRESHOLD;
  const tokenLimit = CONVERSATION_LIMITS.MAX_TOKENS_PER_CONVERSATION;

  // At message limit
  if (messageCount >= messageLimit) {
    return `You've reached the message limit (${messageLimit}). Older messages will be removed automatically, or consider starting a new chat.`;
  }

  // At token limit
  if (tokenCount >= tokenLimit) {
    return `This conversation is getting very long (${Math.round(tokenCount / 1000)}K tokens). Consider starting a new chat for better performance.`;
  }

  // Near message limit
  if (messageCount >= messageThreshold) {
    const remaining = messageLimit - messageCount;
    return `This conversation is getting long (${messageCount}/${messageLimit} messages). You have ${remaining} messages remaining.`;
  }

  // Near token limit
  if (tokenCount >= tokenThreshold) {
    return `This conversation is using significant context. Consider starting a new chat if you notice slower responses.`;
  }

  return null;
}

/**
 * Get storage size estimate
 */
export function getStorageSizeEstimate(
  conversations: Array<{ messageCount: number; estimatedTokens: number }>
): {
  estimatedKB: number;
  percentOfLimit: number;
  isNearLimit: boolean;
} {
  // Rough estimate: 1 token ≈ 8 bytes (including JSON overhead)
  const totalTokens = conversations.reduce(
    (sum, conv) => sum + conv.estimatedTokens,
    0
  );

  const estimatedBytes = totalTokens * 8;
  const estimatedKB = estimatedBytes / 1024;
  const limitKB = CONVERSATION_LIMITS.MAX_STORAGE_SIZE_MB * 1024;

  const percentOfLimit = Math.min(100, Math.round((estimatedKB / limitKB) * 100));
  const isNearLimit = percentOfLimit >= 80;

  return {
    estimatedKB: Math.round(estimatedKB),
    percentOfLimit,
    isNearLimit,
  };
}
