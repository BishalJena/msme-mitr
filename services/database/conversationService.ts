import { createClient } from '@/lib/supabase/client'
import type {
  Conversation,
  ConversationInsert,
  ConversationUpdate,
  ConversationWithMessages,
  Database
} from '@/types/database'

/**
 * Service class for managing conversation-related database operations
 * Handles CRUD operations for conversations with proper error handling
 */
export class ConversationService {
  private supabase: any

  constructor(supabaseClient?: ReturnType<typeof createClient>) {
    // Allow injection of Supabase client for testing or server-side usage
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Create a new conversation for a user
   * @param userId - The ID of the user creating the conversation
   * @param title - Optional title for the conversation (defaults to 'New Chat')
   * @param language - Optional language code (defaults to 'en')
   * @param model - Optional AI model identifier
   * @returns The created conversation
   * @throws Error if creation fails
   */
  async createConversation(
    userId: string,
    title?: string,
    language?: string,
    model?: string
  ): Promise<Conversation> {
    try {
      const conversationData: ConversationInsert = {
        user_id: userId,
        title: title || 'New Chat',
        session_id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        language: language || 'en',
        model: model || 'openai/gpt-4o-mini',
      }

      console.log('[ConversationService] Creating conversation:', conversationData);

      const { data, error } = await this.supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single()

      console.log('[ConversationService] Insert result:', { data, error });

      if (error) {
        console.error('[ConversationService] Insert error:', error);
        throw new Error(`Failed to create conversation: ${error.message}`)
      }

      if (!data) {
        console.error('[ConversationService] No data returned');
        throw new Error('No data returned from conversation creation')
      }

      console.log('[ConversationService] SUCCESS - Created conversation with ID:', data.id);
      return data
    } catch (error) {
      console.error('[ConversationService] Exception:', error);
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while creating conversation')
    }
  }

  /**
   * Get all conversations for a user, ordered by most recent activity
   * @param userId - The ID of the user
   * @param includeArchived - Whether to include archived conversations (defaults to false)
   * @returns Array of conversations
   * @throws Error if fetch fails
   */
  async getConversations(
    userId: string,
    includeArchived: boolean = false
  ): Promise<Conversation[]> {
    try {
      let query = this.supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)

      if (!includeArchived) {
        query = query.eq('is_archived', false)
      }

      const { data, error } = await query.order('last_active_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch conversations: ${error.message}`)
      }

      return data || []
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while fetching conversations')
    }
  }

  /**
   * Get a single conversation by ID with all its messages
   * @param conversationId - The ID of the conversation
   * @returns Conversation with messages
   * @throws Error if fetch fails or conversation not found
   */
  async getConversation(conversationId: string): Promise<ConversationWithMessages> {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select(`
          *,
          messages (*)
        `)
        .eq('id', conversationId)
        .maybeSingle()

      if (error) {
        throw new Error(`Failed to fetch conversation: ${error.message}`)
      }

      if (!data) {
        throw new Error(`Conversation not found: ${conversationId}`)
      }

      // Type assertion needed because Supabase returns nested data
      return data as ConversationWithMessages
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while fetching conversation')
    }
  }

  /**
   * Update a conversation's properties
   * @param conversationId - The ID of the conversation to update
   * @param updates - Partial conversation data to update
   * @returns The updated conversation
   * @throws Error if update fails
   */
  async updateConversation(
    conversationId: string,
    updates: ConversationUpdate
  ): Promise<Conversation> {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update conversation: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data returned from conversation update')
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while updating conversation')
    }
  }

  /**
   * Delete a conversation and all its messages (cascade delete)
   * @param conversationId - The ID of the conversation to delete
   * @throws Error if deletion fails
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (error) {
        throw new Error(`Failed to delete conversation: ${error.message}`)
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while deleting conversation')
    }
  }

  /**
   * Archive a conversation (soft delete)
   * @param conversationId - The ID of the conversation to archive
   * @returns The updated conversation
   * @throws Error if archive fails
   */
  async archiveConversation(conversationId: string): Promise<Conversation> {
    return this.updateConversation(conversationId, { is_archived: true })
  }

  /**
   * Unarchive a conversation
   * @param conversationId - The ID of the conversation to unarchive
   * @returns The updated conversation
   * @throws Error if unarchive fails
   */
  async unarchiveConversation(conversationId: string): Promise<Conversation> {
    return this.updateConversation(conversationId, { is_archived: false })
  }

  /**
   * Pin a conversation to the top of the list
   * @param conversationId - The ID of the conversation to pin
   * @returns The updated conversation
   * @throws Error if pin fails
   */
  async pinConversation(conversationId: string): Promise<Conversation> {
    return this.updateConversation(conversationId, { is_pinned: true })
  }

  /**
   * Unpin a conversation
   * @param conversationId - The ID of the conversation to unpin
   * @returns The updated conversation
   * @throws Error if unpin fails
   */
  async unpinConversation(conversationId: string): Promise<Conversation> {
    return this.updateConversation(conversationId, { is_pinned: false })
  }

  /**
   * Get pinned conversations for a user
   * @param userId - The ID of the user
   * @returns Array of pinned conversations
   * @throws Error if fetch fails
   */
  async getPinnedConversations(userId: string): Promise<Conversation[]> {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_pinned', true)
        .eq('is_archived', false)
        .order('last_active_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch pinned conversations: ${error.message}`)
      }

      return data || []
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while fetching pinned conversations')
    }
  }

  /**
   * Clean up empty conversations (conversations with 0 messages)
   * This is used to remove conversations that were created but never used
   * 
   * Only deletes conversations that have been empty for more than 5 minutes
   * to avoid deleting newly created conversations that are about to receive messages
   * 
   * @param userId - The ID of the user
   * @returns Number of conversations deleted
   * @throws Error if cleanup fails
   */
  async cleanupEmptyConversations(userId: string): Promise<number> {
    try {
      // Only delete conversations that are empty AND older than 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error } = await this.supabase
        .from('conversations')
        .delete()
        .eq('user_id', userId)
        .eq('message_count', 0)
        .lt('created_at', fiveMinutesAgo)
        .select()

      if (error) {
        throw new Error(`Failed to cleanup empty conversations: ${error.message}`)
      }

      return data?.length || 0
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while cleaning up empty conversations')
    }
  }
}
