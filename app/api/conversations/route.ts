/**
 * Conversations API Routes
 * 
 * Handles listing and creating conversations for authenticated users.
 * 
 * GET /api/conversations - List all conversations for the authenticated user
 * POST /api/conversations - Create a new conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  requireAuth,
  success,
  created,
  badRequest,
  internalError,
} from '@/lib/api/auth'
import { ConversationService } from '@/services/database/conversationService'

/**
 * GET /api/conversations
 * 
 * Lists all conversations for the authenticated user, ordered by most recent activity.
 * Optionally includes archived conversations.
 * 
 * Query Parameters:
 * - includeArchived: boolean (optional) - Whether to include archived conversations
 * 
 * @returns Array of conversations
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { user, supabase } = authResult
  
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get('includeArchived') === 'true'
    
    // Create service instance with server-side client
    const conversationService = new ConversationService(supabase)
    
    // Fetch conversations
    const conversations = await conversationService.getConversations(
      user.id,
      includeArchived
    )
    
    return success({
      conversations,
      count: conversations.length,
    })
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    return internalError(
      error instanceof Error ? error.message : 'Failed to fetch conversations'
    )
  }
}

/**
 * POST /api/conversations
 * 
 * Creates a new conversation for the authenticated user.
 * 
 * Request Body:
 * - title: string (optional) - Conversation title (defaults to 'New Chat')
 * - language: string (optional) - Language code (defaults to 'en')
 * - model: string (optional) - AI model identifier (defaults to 'openai/gpt-4o-mini')
 * 
 * @returns The created conversation
 */
export async function POST(request: NextRequest) {
  // Verify authentication
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { user, supabase } = authResult
  
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate title if provided
    if (body.title !== undefined) {
      if (typeof body.title !== 'string') {
        return badRequest('Title must be a string')
      }
      
      if (body.title.length > 200) {
        return badRequest('Title must be 200 characters or less')
      }
    }
    
    // Validate language if provided
    if (body.language !== undefined && typeof body.language !== 'string') {
      return badRequest('Language must be a string')
    }
    
    // Validate model if provided
    if (body.model !== undefined && typeof body.model !== 'string') {
      return badRequest('Model must be a string')
    }
    
    // Create service instance with server-side client
    const conversationService = new ConversationService(supabase)
    
    // Create conversation
    const conversation = await conversationService.createConversation(
      user.id,
      body.title,
      body.language,
      body.model
    )
    
    return created({
      conversation,
      message: 'Conversation created successfully',
    })
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return internalError(
      error instanceof Error ? error.message : 'Failed to create conversation'
    )
  }
}
