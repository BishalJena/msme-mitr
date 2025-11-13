/**
 * Example Admin-Only API Route
 * 
 * This demonstrates how to use role-based access control (RBAC)
 * to restrict routes to admin users only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole, success, internalError } from '@/lib/api/auth'

/**
 * GET /api/example-admin
 * 
 * Example of an admin-only route that requires specific roles.
 * Returns a list of all users (admin functionality).
 */
export async function GET(request: NextRequest) {
  // Verify authentication AND check for admin role
  const authResult = await requireRole(request, ['admin', 'super_admin'])
  
  // If authentication or authorization failed, return the error response
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  // Extract user, profile, and supabase client from successful auth
  const { user, profile, supabase } = authResult
  
  try {
    // Fetch all user profiles (admin-only operation)
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Users fetch error:', error)
      return internalError('Failed to fetch users')
    }
    
    // Return success response with admin data
    return success({
      users,
      total: users?.length || 0,
      admin: {
        id: user.id,
        email: user.email,
        role: profile.role,
      },
      message: 'Admin access granted',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return internalError('An unexpected error occurred')
  }
}

/**
 * POST /api/example-admin
 * 
 * Example of an admin-only route for creating system-wide resources.
 * Only super_admin can create new schemes.
 */
export async function POST(request: NextRequest) {
  // Verify authentication AND check for super_admin role only
  const authResult = await requireRole(request, ['super_admin'])
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { supabase } = authResult
  
  try {
    const body = await request.json()
    
    // Create a new scheme (super admin only)
    const { data: scheme, error } = await supabase
      .from('schemes')
      .insert({
        scheme_name: body.scheme_name,
        description: body.description,
        category: body.category,
        is_active: true,
      } as any) // Type assertion for example route
      .select()
      .single()
    
    if (error) {
      console.error('Scheme creation error:', error)
      return internalError('Failed to create scheme')
    }
    
    return success(
      {
        scheme,
        message: 'Scheme created successfully',
      },
      201
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return internalError('An unexpected error occurred')
  }
}
