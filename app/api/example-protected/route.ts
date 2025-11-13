/**
 * Example Protected API Route
 * 
 * This is a demonstration of how to use the API route protection utilities.
 * This file can be used as a reference when implementing new API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, success, badRequest, internalError } from '@/lib/api/auth'

/**
 * GET /api/example-protected
 * 
 * Example of a protected route that requires authentication.
 * Returns the authenticated user's information.
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const authResult = await requireAuth(request)
  
  // If authentication failed, return the error response
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  // Extract user and supabase client from successful auth
  const { user, supabase } = authResult
  
  try {
    // Fetch user profile from database
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('Profile fetch error:', error)
      return internalError('Failed to fetch user profile')
    }
    
    // Return success response with user data
    return success({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      message: 'Successfully authenticated',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return internalError('An unexpected error occurred')
  }
}

/**
 * POST /api/example-protected
 * 
 * Example of a protected route that accepts data and validates it.
 * Creates a new conversation for the authenticated user.
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
    
    // Validate required fields
    if (!body.title || typeof body.title !== 'string') {
      return badRequest('Title is required and must be a string')
    }
    
    if (body.title.length < 1 || body.title.length > 100) {
      return badRequest('Title must be between 1 and 100 characters')
    }
    
    // Create conversation in database
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: body.title,
        session_id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        language: body.language || 'en',
        model: body.model || 'openai/gpt-4o-mini',
      } as any) // Type assertion for example route
      .select()
      .single()
    
    if (error) {
      console.error('Conversation creation error:', error)
      return internalError('Failed to create conversation')
    }
    
    // Return success response with created resource
    return success(
      {
        conversation,
        message: 'Conversation created successfully',
      },
      201 // HTTP 201 Created
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return internalError('An unexpected error occurred')
  }
}
