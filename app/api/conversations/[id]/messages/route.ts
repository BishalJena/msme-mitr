/**
 * Messages API Routes
 * 
 * Handles operations on messages within a specific conversation.
 * 
 * POST /api/conversations/[id]/messages - Add a new message to a conversation
 * GET /api/conversations/[id]/messages - Get all messages in a conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  requireAuth,
  success,
  created,
  badRequest,
  notFound,
  forbidden,
  internalError,
} from '@/lib/api/auth'
import { MessageService } from '@/services/database/messageService'
import { ConversationService } from '@/services/database/conversationService'

/**
 * POST /api/conversations/[id]/messages
 * 
 * Adds a new message to a conversation.
 * Only the conversation owner can add messages.
 * Automatically increments message_count and updates last_active_at.
 * 
 * Request Body:
 * - role: 'user' | 'assistant' | 'system' (required)
 * - content: string (required, non-empty)
 * - parts: any (optional, for AI SDK v5 support)
 * 
 * @param params.id - Conversation ID
 * @returns Created message
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify authentication
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { user, supabase } = authResult
  const { id: conversationId } = await params
  
  // Validate conversation ID
  if (!conversationId || typeof conversationId !== 'string') {
    return badRequest('Invalid conversation ID')
  }
  
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.role) {
      return badRequest('Message role is required')
    }
    
    if (!body.content) {
      return badRequest('Message content is required')
    }
    
    // Validate role
    const validRoles = ['user', 'assistant', 'system']
    if (!validRoles.includes(body.role)) {
      return badRequest(`Invalid role. Must be one of: ${validRoles.join(', ')}`)
    }
    
    // Validate content
    if (typeof body.content !== 'string') {
      return badRequest('Message content must be a string')
    }
    
    if (body.content.trim().length === 0) {
      return badRequest('Message content cannot be empty')
    }
    
    if (body.content.length > 50000) {
      return badRequest('Message content must be 50,000 characters or less')
    }
    
    // Validate parts if provided
    if (body.parts !== undefined && body.parts !== null) {
      if (typeof body.parts !== 'object') {
        return badRequest('Message parts must be an object or array')
      }
    }
    
    // Create service instances with server-side client
    const conversationService = new ConversationService(supabase)
    const messageService = new MessageService(supabase)
    
    // Verify conversation exists and user owns it
    try {
      const conversation = await conversationService.getConversation(conversationId)
      
      if (conversation.user_id !== user.id) {
        return forbidden('You do not have access to this conversation')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return notFound('Conversation not found')
      }
      throw error
    }
    
    // Add message to conversation
    const message = await messageService.addMessage(
      conversationId,
      body.role,
      body.content,
      body.parts || null
    )
    
    return created({
      message,
    })
  } catch (error) {
    console.error('Failed to add message:', error)
    return internalError(
      error instanceof Error ? error.message : 'Failed to add message'
    )
  }
}

/**
 * GET /api/conversations/[id]/messages
 * 
 * Retrieves all messages in a conversation.
 * Only the conversation owner can access messages.
 * Messages are returned in chronological order (oldest first).
 * 
 * Query Parameters (optional):
 * - limit: number - Maximum number of messages to return
 * - offset: number - Number of messages to skip (for pagination)
 * 
 * @param params.id - Conversation ID
 * @returns Array of messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify authentication
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { user, supabase } = authResult
  const { id: conversationId } = await params
  
  // Validate conversation ID
  if (!conversationId || typeof conversationId !== 'string') {
    return badRequest('Invalid conversation ID')
  }
  
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    
    let limit: number | undefined
    let offset: number | undefined
    
    // Validate limit parameter
    if (limitParam !== null) {
      limit = parseInt(limitParam, 10)
      
      if (isNaN(limit) || limit < 1) {
        return badRequest('Limit must be a positive integer')
      }
      
      if (limit > 1000) {
        return badRequest('Limit must be 1000 or less')
      }
    }
    
    // Validate offset parameter
    if (offsetParam !== null) {
      offset = parseInt(offsetParam, 10)
      
      if (isNaN(offset) || offset < 0) {
        return badRequest('Offset must be a non-negative integer')
      }
    }
    
    // Create service instances with server-side client
    const conversationService = new ConversationService(supabase)
    const messageService = new MessageService(supabase)
    
    // Verify conversation exists and user owns it
    try {
      const conversation = await conversationService.getConversation(conversationId)
      
      if (conversation.user_id !== user.id) {
        return forbidden('You do not have access to this conversation')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return notFound('Conversation not found')
      }
      throw error
    }
    
    // Fetch messages
    const messages = await messageService.getMessages(conversationId, limit, offset)
    
    return success({
      messages,
      count: messages.length,
      ...(limit !== undefined && { limit }),
      ...(offset !== undefined && { offset }),
    })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return internalError(
      error instanceof Error ? error.message : 'Failed to fetch messages'
    )
  }
}
