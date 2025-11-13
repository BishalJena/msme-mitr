/**
 * Individual Conversation API Routes
 * 
 * Handles operations on a specific conversation.
 * 
 * GET /api/conversations/[id] - Get a conversation with its messages
 * PATCH /api/conversations/[id] - Update a conversation
 * DELETE /api/conversations/[id] - Delete a conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  requireAuth,
  success,
  badRequest,
  notFound,
  forbidden,
  internalError,
  noContent,
} from '@/lib/api/auth'
import { ConversationService } from '@/services/database/conversationService'

/**
 * GET /api/conversations/[id]
 * 
 * Retrieves a specific conversation with all its messages.
 * Only the conversation owner can access it.
 * 
 * @param params.id - Conversation ID
 * @returns Conversation with messages
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
  const { id } = await params
  
  // Validate conversation ID
  if (!id || typeof id !== 'string') {
    return badRequest('Invalid conversation ID')
  }
  
  try {
    // Create service instance with server-side client
    const conversationService = new ConversationService(supabase)
    
    // Fetch conversation with messages
    const conversation = await conversationService.getConversation(id)
    
    // Verify ownership (RLS should handle this, but double-check)
    if (conversation.user_id !== user.id) {
      return forbidden('You do not have access to this conversation')
    }
    
    return success({
      conversation,
    })
  } catch (error) {
    console.error('Failed to fetch conversation:', error)
    
    // Check if it's a not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return notFound('Conversation not found')
    }
    
    return internalError(
      error instanceof Error ? error.message : 'Failed to fetch conversation'
    )
  }
}

/**
 * PATCH /api/conversations/[id]
 * 
 * Updates a conversation's properties.
 * Only the conversation owner can update it.
 * 
 * Request Body (all optional):
 * - title: string - Conversation title
 * - language: string - Language code
 * - model: string - AI model identifier
 * - is_archived: boolean - Archive status
 * - is_pinned: boolean - Pin status
 * 
 * @param params.id - Conversation ID
 * @returns Updated conversation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify authentication
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { user, supabase } = authResult
  const { id } = await params
  
  // Validate conversation ID
  if (!id || typeof id !== 'string') {
    return badRequest('Invalid conversation ID')
  }
  
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate that at least one field is being updated
    if (Object.keys(body).length === 0) {
      return badRequest('No fields to update')
    }
    
    // Validate individual fields if provided
    if (body.title !== undefined) {
      if (typeof body.title !== 'string') {
        return badRequest('Title must be a string')
      }
      if (body.title.length > 200) {
        return badRequest('Title must be 200 characters or less')
      }
    }
    
    if (body.language !== undefined && typeof body.language !== 'string') {
      return badRequest('Language must be a string')
    }
    
    if (body.model !== undefined && typeof body.model !== 'string') {
      return badRequest('Model must be a string')
    }
    
    if (body.is_archived !== undefined && typeof body.is_archived !== 'boolean') {
      return badRequest('is_archived must be a boolean')
    }
    
    if (body.is_pinned !== undefined && typeof body.is_pinned !== 'boolean') {
      return badRequest('is_pinned must be a boolean')
    }
    
    // Prevent updating protected fields
    const allowedFields = ['title', 'language', 'model', 'is_archived', 'is_pinned']
    const updates: any = {}
    
    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        updates[key] = body[key]
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return badRequest('No valid fields to update')
    }
    
    // Create service instance with server-side client
    const conversationService = new ConversationService(supabase)
    
    // First verify the conversation exists and user owns it
    try {
      const existingConversation = await conversationService.getConversation(id)
      
      if (existingConversation.user_id !== user.id) {
        return forbidden('You do not have access to this conversation')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return notFound('Conversation not found')
      }
      throw error
    }
    
    // Update conversation
    const conversation = await conversationService.updateConversation(id, updates)
    
    return success({
      conversation,
      message: 'Conversation updated successfully',
    })
  } catch (error) {
    console.error('Failed to update conversation:', error)
    return internalError(
      error instanceof Error ? error.message : 'Failed to update conversation'
    )
  }
}

/**
 * DELETE /api/conversations/[id]
 * 
 * Deletes a conversation and all its messages (cascade delete).
 * Only the conversation owner can delete it.
 * 
 * @param params.id - Conversation ID
 * @returns 204 No Content on success
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify authentication
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { user, supabase } = authResult
  const { id } = await params
  
  // Validate conversation ID
  if (!id || typeof id !== 'string') {
    return badRequest('Invalid conversation ID')
  }
  
  try {
    // Create service instance with server-side client
    const conversationService = new ConversationService(supabase)
    
    // First verify the conversation exists and user owns it
    try {
      const existingConversation = await conversationService.getConversation(id)
      
      if (existingConversation.user_id !== user.id) {
        return forbidden('You do not have access to this conversation')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return notFound('Conversation not found')
      }
      throw error
    }
    
    // Delete conversation
    await conversationService.deleteConversation(id)
    
    return noContent()
  } catch (error) {
    console.error('Failed to delete conversation:', error)
    return internalError(
      error instanceof Error ? error.message : 'Failed to delete conversation'
    )
  }
}
