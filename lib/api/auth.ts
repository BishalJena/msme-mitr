/**
 * API Route Protection Utilities
 * 
 * This module provides utilities for protecting API routes with authentication
 * and role-based access control (RBAC) using Supabase Auth.
 * 
 * @module lib/api/auth
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { UserProfile } from '@/types/database'
import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

/**
 * Result of successful authentication
 */
export interface AuthResult {
  user: User
  supabase: SupabaseClient<Database>
}

/**
 * Result of successful role-based authentication
 */
export interface RoleAuthResult extends AuthResult {
  profile: UserProfile
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: string
  message: string
  code?: string
}

// ============================================================================
// Authentication Utilities
// ============================================================================

/**
 * Requires authentication for an API route
 * 
 * Verifies that the request has a valid authentication token and returns
 * the authenticated user and Supabase client. If authentication fails,
 * returns a 401 Unauthorized response.
 * 
 * @param request - The Next.js request object
 * @returns AuthResult with user and supabase client, or NextResponse with 401 error
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAuth(request)
 *   
 *   if (authResult instanceof NextResponse) {
 *     return authResult // Return error response
 *   }
 *   
 *   const { user, supabase } = authResult
 *   // Continue with authenticated request...
 * }
 * ```
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Auth error:', error)
      return createErrorResponse(
        'Authentication failed',
        'Failed to verify authentication token',
        401,
        error.message
      )
    }

    if (!user) {
      return createErrorResponse(
        'not_authenticated',
        'The user does not have an active session or is not authenticated',
        401
      )
    }

    return { user, supabase }
  } catch (error) {
    console.error('Unexpected auth error:', error)
    return createErrorResponse(
      'internal_error',
      'An unexpected error occurred during authentication',
      500
    )
  }
}

/**
 * Requires authentication and specific role(s) for an API route
 * 
 * Verifies that the request has a valid authentication token and that the
 * user has one of the allowed roles. Returns the authenticated user, their
 * profile, and Supabase client. If authentication or authorization fails,
 * returns appropriate error response (401 or 403).
 * 
 * @param request - The Next.js request object
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns RoleAuthResult with user, profile, and supabase client, or NextResponse with error
 * 
 * @example
 * ```typescript
 * export async function DELETE(request: NextRequest) {
 *   const authResult = await requireRole(request, ['admin', 'super_admin'])
 *   
 *   if (authResult instanceof NextResponse) {
 *     return authResult // Return error response
 *   }
 *   
 *   const { user, profile, supabase } = authResult
 *   // Continue with authorized request...
 * }
 * ```
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: Array<'user' | 'admin' | 'super_admin'>
): Promise<RoleAuthResult | NextResponse> {
  // First check authentication
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Return authentication error
  }

  const { user, supabase } = authResult

  try {
    // Fetch user profile to check role
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Profile fetch error:', error)
      return createErrorResponse(
        'profile_not_found',
        'User profile not found',
        404,
        error.message
      )
    }

    if (!profile) {
      return createErrorResponse(
        'profile_not_found',
        'User profile not found',
        404
      )
    }

    // Type assertion needed due to Supabase type inference issues
    const typedProfile = profile as UserProfile

    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(typedProfile.role)) {
      return createErrorResponse(
        'forbidden',
        `Access denied. Required role: ${allowedRoles.join(' or ')}. Current role: ${typedProfile.role}`,
        403
      )
    }

    return { user, profile: typedProfile, supabase }
  } catch (error) {
    console.error('Unexpected role check error:', error)
    return createErrorResponse(
      'internal_error',
      'An unexpected error occurred during authorization',
      500
    )
  }
}

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * Creates a standardized error response
 * 
 * @param error - Error code/identifier
 * @param message - Human-readable error message
 * @param status - HTTP status code
 * @param code - Optional error code for debugging
 * @returns NextResponse with error JSON
 */
export function createErrorResponse(
  error: string,
  message: string,
  status: number,
  code?: string
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    error,
    message,
  }

  if (code) {
    response.code = code
  }

  return NextResponse.json(response, { status })
}

/**
 * Creates a 400 Bad Request error response
 * 
 * @param message - Error message
 * @param error - Optional error identifier (defaults to 'bad_request')
 * @returns NextResponse with 400 status
 * 
 * @example
 * ```typescript
 * if (!body.email) {
 *   return badRequest('Email is required')
 * }
 * ```
 */
export function badRequest(
  message: string,
  error: string = 'bad_request'
): NextResponse<ErrorResponse> {
  return createErrorResponse(error, message, 400)
}

/**
 * Creates a 401 Unauthorized error response
 * 
 * @param message - Error message
 * @param error - Optional error identifier (defaults to 'unauthorized')
 * @returns NextResponse with 401 status
 * 
 * @example
 * ```typescript
 * if (!token) {
 *   return unauthorized('Authentication token required')
 * }
 * ```
 */
export function unauthorized(
  message: string = 'Authentication required',
  error: string = 'unauthorized'
): NextResponse<ErrorResponse> {
  return createErrorResponse(error, message, 401)
}

/**
 * Creates a 403 Forbidden error response
 * 
 * @param message - Error message
 * @param error - Optional error identifier (defaults to 'forbidden')
 * @returns NextResponse with 403 status
 * 
 * @example
 * ```typescript
 * if (user.role !== 'admin') {
 *   return forbidden('Admin access required')
 * }
 * ```
 */
export function forbidden(
  message: string = 'Access denied',
  error: string = 'forbidden'
): NextResponse<ErrorResponse> {
  return createErrorResponse(error, message, 403)
}

/**
 * Creates a 404 Not Found error response
 * 
 * @param message - Error message
 * @param error - Optional error identifier (defaults to 'not_found')
 * @returns NextResponse with 404 status
 * 
 * @example
 * ```typescript
 * if (!conversation) {
 *   return notFound('Conversation not found')
 * }
 * ```
 */
export function notFound(
  message: string = 'Resource not found',
  error: string = 'not_found'
): NextResponse<ErrorResponse> {
  return createErrorResponse(error, message, 404)
}

/**
 * Creates a 500 Internal Server Error response
 * 
 * @param message - Error message
 * @param error - Optional error identifier (defaults to 'internal_error')
 * @returns NextResponse with 500 status
 * 
 * @example
 * ```typescript
 * try {
 *   // ... operation
 * } catch (err) {
 *   return internalError('Failed to process request')
 * }
 * ```
 */
export function internalError(
  message: string = 'Internal server error',
  error: string = 'internal_error'
): NextResponse<ErrorResponse> {
  return createErrorResponse(error, message, 500)
}

/**
 * Creates a 409 Conflict error response
 * 
 * @param message - Error message
 * @param error - Optional error identifier (defaults to 'conflict')
 * @returns NextResponse with 409 status
 * 
 * @example
 * ```typescript
 * if (existingUser) {
 *   return conflict('User already exists')
 * }
 * ```
 */
export function conflict(
  message: string,
  error: string = 'conflict'
): NextResponse<ErrorResponse> {
  return createErrorResponse(error, message, 409)
}

/**
 * Creates a 422 Unprocessable Entity error response
 * 
 * @param message - Error message
 * @param error - Optional error identifier (defaults to 'validation_error')
 * @returns NextResponse with 422 status
 * 
 * @example
 * ```typescript
 * if (validationErrors.length > 0) {
 *   return unprocessableEntity('Invalid input data')
 * }
 * ```
 */
export function unprocessableEntity(
  message: string,
  error: string = 'validation_error'
): NextResponse<ErrorResponse> {
  return createErrorResponse(error, message, 422)
}

// ============================================================================
// Success Response Helpers
// ============================================================================

/**
 * Creates a standardized success response
 * 
 * @param data - Response data
 * @param status - HTTP status code (defaults to 200)
 * @returns NextResponse with data JSON
 * 
 * @example
 * ```typescript
 * return success({ conversation: newConversation }, 201)
 * ```
 */
export function success<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status })
}

/**
 * Creates a 201 Created success response
 * 
 * @param data - Response data
 * @returns NextResponse with 201 status
 * 
 * @example
 * ```typescript
 * return created({ id: newId, ...data })
 * ```
 */
export function created<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 })
}

/**
 * Creates a 204 No Content success response
 * 
 * @returns NextResponse with 204 status and no body
 * 
 * @example
 * ```typescript
 * await deleteConversation(id)
 * return noContent()
 * ```
 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}
