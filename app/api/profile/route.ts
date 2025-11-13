/**
 * User Profile API Routes
 * 
 * Handles fetching and updating user profile information for authenticated users.
 * 
 * GET /api/profile - Get the authenticated user's profile
 * PATCH /api/profile - Update the authenticated user's profile
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  requireAuth,
  success,
  badRequest,
  internalError,
  unprocessableEntity,
} from '@/lib/api/auth'
import { ProfileService } from '@/services/database/profileService'
import type { UserProfileUpdate } from '@/types/database'

/**
 * GET /api/profile
 * 
 * Retrieves the profile information for the authenticated user.
 * 
 * @returns The user's profile data
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { user, supabase } = authResult
  
  try {
    // Create service instance with server-side client
    const profileService = new ProfileService(supabase)
    
    // Fetch user profile
    const profile = await profileService.getProfile(user.id)
    
    return success({
      profile,
    })
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return internalError('Profile not found')
    }
    
    return internalError(
      error instanceof Error ? error.message : 'Failed to fetch profile'
    )
  }
}

/**
 * PATCH /api/profile
 * 
 * Updates the profile information for the authenticated user.
 * Validates all fields before updating and returns the updated profile.
 * 
 * Request Body (all fields optional):
 * - full_name: string | null - User's full name
 * - phone: string | null - Phone number
 * - business_name: string | null - Business name
 * - business_type: string | null - Type of business
 * - business_category: string | null - Business category
 * - annual_turnover: number | null - Annual turnover amount
 * - employee_count: number | null - Number of employees
 * - state: string | null - State/region
 * - district: string | null - District
 * - pincode: string | null - Postal code (6 digits)
 * - language: string - Language preference code
 * - preferred_model: string - Preferred AI model
 * 
 * @returns The updated profile data
 */
export async function PATCH(request: NextRequest) {
  // Verify authentication
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { user, supabase } = authResult
  
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate that body is an object
    if (typeof body !== 'object' || body === null) {
      return badRequest('Request body must be a valid JSON object')
    }
    
    // Validate that at least one field is provided
    const updateFields = Object.keys(body)
    if (updateFields.length === 0) {
      return badRequest('At least one field must be provided for update')
    }
    
    // Validate individual fields
    const validationError = validateProfileFields(body)
    if (validationError) {
      return unprocessableEntity(validationError)
    }
    
    // Prepare update data (only include provided fields)
    const updates: UserProfileUpdate = {}
    
    // String fields
    if ('full_name' in body) updates.full_name = body.full_name
    if ('phone' in body) updates.phone = body.phone
    if ('business_name' in body) updates.business_name = body.business_name
    if ('business_type' in body) updates.business_type = body.business_type
    if ('business_category' in body) updates.business_category = body.business_category
    if ('state' in body) updates.state = body.state
    if ('district' in body) updates.district = body.district
    if ('pincode' in body) updates.pincode = body.pincode
    if ('language' in body) updates.language = body.language
    if ('preferred_model' in body) updates.preferred_model = body.preferred_model
    
    // Number fields
    if ('annual_turnover' in body) updates.annual_turnover = body.annual_turnover
    if ('employee_count' in body) updates.employee_count = body.employee_count
    
    // Create service instance with server-side client
    const profileService = new ProfileService(supabase)
    
    // Update profile (service handles validation and updated_at timestamp)
    const updatedProfile = await profileService.updateProfile(user.id, updates)
    
    return success({
      profile: updatedProfile,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Failed to update profile:', error)
    
    // Handle validation errors from service
    if (error instanceof Error && error.message.includes('Invalid')) {
      return unprocessableEntity(error.message)
    }
    
    return internalError(
      error instanceof Error ? error.message : 'Failed to update profile'
    )
  }
}

/**
 * Validates profile update fields
 * 
 * @param body - Request body with profile updates
 * @returns Error message if validation fails, null if valid
 */
function validateProfileFields(body: any): string | null {
  // Validate string fields (if provided, must be string or null)
  const stringFields = [
    'full_name',
    'phone',
    'business_name',
    'business_type',
    'business_category',
    'state',
    'district',
    'pincode',
    'language',
    'preferred_model',
  ]
  
  for (const field of stringFields) {
    if (field in body) {
      const value = body[field]
      if (value !== null && typeof value !== 'string') {
        return `${field} must be a string or null`
      }
      
      // Check string length limits
      if (typeof value === 'string') {
        if (field === 'full_name' && value.length > 100) {
          return 'full_name must be 100 characters or less'
        }
        if (field === 'phone' && value.length > 20) {
          return 'phone must be 20 characters or less'
        }
        if (field === 'business_name' && value.length > 200) {
          return 'business_name must be 200 characters or less'
        }
        if (field === 'pincode' && value.length > 10) {
          return 'pincode must be 10 characters or less'
        }
      }
    }
  }
  
  // Validate number fields (if provided, must be number or null)
  if ('annual_turnover' in body) {
    const value = body.annual_turnover
    if (value !== null && typeof value !== 'number') {
      return 'annual_turnover must be a number or null'
    }
    if (typeof value === 'number' && value < 0) {
      return 'annual_turnover must be a positive number'
    }
  }
  
  if ('employee_count' in body) {
    const value = body.employee_count
    if (value !== null && typeof value !== 'number') {
      return 'employee_count must be a number or null'
    }
    if (typeof value === 'number' && (value < 0 || !Number.isInteger(value))) {
      return 'employee_count must be a positive integer'
    }
  }
  
  // Validate role (should not be updated via this endpoint)
  if ('role' in body) {
    return 'role cannot be updated via this endpoint'
  }
  
  // Validate email (should not be updated via this endpoint)
  if ('email' in body) {
    return 'email cannot be updated via this endpoint'
  }
  
  // Validate id (should not be updated)
  if ('id' in body) {
    return 'id cannot be updated'
  }
  
  // Validate timestamp fields (should not be manually set)
  if ('created_at' in body || 'last_login_at' in body) {
    return 'timestamp fields cannot be manually updated'
  }
  
  return null
}
