import { createClient } from '@/lib/supabase/client'
import type {
  Message,
  MessageInsert,
  MessageUpdate,
} from '@/types/database'

/**
 * Service class for managing message-related database operations
 * Handles CRUD operations for messages with proper error handling
 */
export class MessageService {
  private supabase: any

  constructor(supabaseClient?: ReturnType<typeof createClient>) {
    // Allow injection of Supabase client for testing or server-side usage
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Add a new message to a conversation
   * Automatically increments the conversation's message_count and updates last_active_at
   * @param conversationId - The ID of the conversation
   * @param role - The role of the message sender ('user', 'assistant', or 'system')
   * @param content - The message content (string or any format that can be converted to string)
   * @param parts - Optional AI SDK v5 parts data (JSONB)
   * @returns The created message
   * @throws Error if creation fails
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string | any,
    parts?: any
  ): Promise<Message> {
    try {
      // CRITICAL: Ensure content is ALWAYS a string
      let stringContent: string;

      if (typeof content === 'string') {
        stringContent = content;
      } else if (Array.isArray(content)) {
        // Extract text from array of content parts
        stringContent = (content as any[])
          .map((c: any) => {
            if (typeof c === 'string') return c;
            if (c?.text) return c.text;
            if (c?.content) return typeof c.content === 'string' ? c.content : '';
            return '';
          })
          .filter(Boolean)
          .join(' ');
      } else if (content && typeof content === 'object') {
        // Handle object content
        const obj = content as any;
        if ('text' in obj) {
          stringContent = String(obj.text);
        } else if ('content' in obj) {
          stringContent = String(obj.content);
        } else {
          stringContent = JSON.stringify(content);
        }
      } else {
        stringContent = String(content || '');
      }

      // Validate we have actual content
      if (!stringContent || stringContent.trim().length === 0) {
        throw new Error('Message content cannot be empty');
      }

      const messageData: MessageInsert = {
        conversation_id: conversationId,
        role,
        content: stringContent, // Guaranteed to be a string
        parts: parts || null,
      }

      const { data, error } = await this.supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to add message: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data returned from message creation')
      }

      // Increment message count and update last_active_at using database function
      const { error: rpcError } = await this.supabase.rpc('increment_message_count', {
        p_conversation_id: conversationId,
      } as any)

      if (rpcError) {
        console.error('Failed to increment message count:', rpcError.message)
        // Don't throw here - message was created successfully
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while adding message')
    }
  }

  /**
   * Get all messages for a conversation, ordered by creation time
   * @param conversationId - The ID of the conversation
   * @param limit - Optional limit on number of messages to return
   * @param offset - Optional offset for pagination
   * @returns Array of messages
   * @throws Error if fetch fails
   */
  async getMessages(
    conversationId: string,
    limit?: number,
    offset?: number
  ): Promise<Message[]> {
    try {
      let query = this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (limit !== undefined) {
        query = query.limit(limit)
      }

      if (offset !== undefined) {
        query = query.range(offset, offset + (limit || 100) - 1)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch messages: ${error.message}`)
      }

      return data || []
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while fetching messages')
    }
  }

  /**
   * Delete a message from a conversation
   * Note: This does not decrement the message_count as it's typically used for cleanup
   * @param messageId - The ID of the message to delete
   * @throws Error if deletion fails
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (error) {
        throw new Error(`Failed to delete message: ${error.message}`)
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while deleting message')
    }
  }

  /**
   * Update a message's content or parts
   * @param messageId - The ID of the message to update
   * @param updates - Partial message data to update
   * @returns The updated message
   * @throws Error if update fails
   */
  async updateMessage(
    messageId: string,
    updates: MessageUpdate
  ): Promise<Message> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .update(updates)
        .eq('id', messageId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update message: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data returned from message update')
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while updating message')
    }
  }

  /**
   * Get the most recent message in a conversation
   * @param conversationId - The ID of the conversation
   * @returns The most recent message or null if no messages exist
   * @throws Error if fetch fails
   */
  async getLatestMessage(conversationId: string): Promise<Message | null> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        throw new Error(`Failed to fetch latest message: ${error.message}`)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while fetching latest message')
    }
  }

  /**
   * Get message count for a conversation
   * @param conversationId - The ID of the conversation
   * @returns The number of messages in the conversation
   * @throws Error if count fails
   */
  async getMessageCount(conversationId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)

      if (error) {
        throw new Error(`Failed to count messages: ${error.message}`)
      }

      return count || 0
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while counting messages')
    }
  }

  /**
   * Delete all messages in a conversation
   * Note: This is typically handled by cascade delete when deleting a conversation
   * @param conversationId - The ID of the conversation
   * @throws Error if deletion fails
   */
  async deleteAllMessages(conversationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)

      if (error) {
        throw new Error(`Failed to delete messages: ${error.message}`)
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while deleting messages')
    }
  }
}
