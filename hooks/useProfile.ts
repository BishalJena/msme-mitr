/**
 * useProfile Hook
 * 
 * Custom React hook for managing user profile data.
 * Provides profile fetching, updates with validation, loading and error states.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileService } from '@/services/database/profileService'
import type { UserProfile, UserProfileUpdate } from '@/types/database'
import { toast } from 'sonner'

// ============================================================================
// Types
// ============================================================================

export interface UseProfileOptions {
  autoLoad?: boolean
}

export interface UseProfileReturn {
  // Data
  profile: UserProfile | null
  loading: boolean
  error: Error | null
  
  // Actions
  updateProfile: (updates: UserProfileUpdate) => Promise<UserProfile | null>
  updateLastLogin: () => Promise<UserProfile | null>
  
  // Utilities
  refresh: () => Promise<void>
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing user profile
 * 
 * @param options - Configuration options
 * @returns Profile data and management functions
 * 
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { profile, loading, updateProfile } = useProfile()
 *   
 *   if (loading) return <div>Loading...</div>
 *   
 *   const handleUpdate = async () => {
 *     await updateProfile({
 *       full_name: 'John Doe',
 *       business_name: 'My Business'
 *     })
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>{profile?.full_name}</h1>
 *       <button onClick={handleUpdate}>Update Profile</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useProfile(
  options: UseProfileOptions = {}
): UseProfileReturn {
  const { autoLoad = true } = options
  const { user, profile: authProfile } = useAuth()
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(authProfile)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Service instance
  const profileService = new ProfileService()
  
  /**
   * Load profile from database
   */
  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const data = await profileService.getProfile(user.id)
      setProfile(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load profile')
      setError(error)
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [user])
  
  /**
   * Sync with AuthContext profile
   */
  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile)
      setLoading(false)
    } else if (autoLoad && user) {
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [authProfile, autoLoad, user, loadProfile])
  
  /**
   * Update user profile with validation
   */
  const updateProfile = useCallback(
    async (updates: UserProfileUpdate): Promise<UserProfile | null> => {
      if (!user) {
        toast.error('You must be logged in to update your profile')
        return null
      }
      
      try {
        // Validate updates before sending
        validateProfileUpdates(updates)
        
        const updatedProfile = await profileService.updateProfile(user.id, updates)
        
        // Update local state
        setProfile(updatedProfile)
        
        toast.success('Profile updated successfully')
        return updatedProfile
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update profile')
        setError(error)
        console.error('Error updating profile:', error)
        
        // Show specific error message for validation errors
        if (error.message.includes('Invalid') || 
            error.message.includes('must be') || 
            error.message.includes('format')) {
          toast.error(error.message)
        } else {
          toast.error('Failed to update profile')
        }
        
        return null
      }
    },
    [user]
  )
  
  /**
   * Update last login timestamp
   */
  const updateLastLogin = useCallback(
    async (): Promise<UserProfile | null> => {
      if (!user) {
        return null
      }
      
      try {
        const updatedProfile = await profileService.updateLastLogin(user.id)
        
        // Update local state
        setProfile(updatedProfile)
        
        return updatedProfile
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update last login')
        console.error('Error updating last login:', error)
        // Don't show toast for this - it's a background operation
        return null
      }
    },
    [user]
  )
  
  /**
   * Refresh profile from database
   */
  const refresh = useCallback(async () => {
    await loadProfile()
  }, [loadProfile])
  
  return {
    // Data
    profile,
    loading,
    error,
    
    // Actions
    updateProfile,
    updateLastLogin,
    
    // Utilities
    refresh,
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate profile updates before sending to database
 * Throws error if validation fails
 */
function validateProfileUpdates(updates: UserProfileUpdate): void {
  // Validate email format if provided
  if (updates.email !== undefined) {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/
    if (!emailRegex.test(updates.email)) {
      throw new Error('Invalid email format')
    }
  }
  
  // Validate phone format if provided (basic validation)
  if (updates.phone !== undefined && updates.phone !== null) {
    const phoneRegex = /^[+]?[\d\s-()]+$/
    if (!phoneRegex.test(updates.phone)) {
      throw new Error('Invalid phone format')
    }
  }
  
  // Validate role if provided
  if (updates.role !== undefined) {
    const validRoles = ['user', 'admin', 'super_admin']
    if (!validRoles.includes(updates.role)) {
      throw new Error('Invalid role. Must be one of: user, admin, super_admin')
    }
  }
  
  // Validate annual turnover if provided (must be positive)
  if (updates.annual_turnover !== undefined && updates.annual_turnover !== null) {
    if (updates.annual_turnover < 0) {
      throw new Error('Annual turnover must be a positive number')
    }
  }
  
  // Validate employee count if provided (must be positive integer)
  if (updates.employee_count !== undefined && updates.employee_count !== null) {
    if (updates.employee_count < 0 || !Number.isInteger(updates.employee_count)) {
      throw new Error('Employee count must be a positive integer')
    }
  }
  
  // Validate pincode format if provided (basic validation for Indian pincodes)
  if (updates.pincode !== undefined && updates.pincode !== null) {
    const pincodeRegex = /^\d{6}$/
    if (!pincodeRegex.test(updates.pincode)) {
      throw new Error('Invalid pincode format. Must be 6 digits')
    }
  }
  
  // Validate language code if provided (basic validation)
  if (updates.language !== undefined) {
    const validLanguages = ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'or', 'pa', 'ur']
    if (!validLanguages.includes(updates.language)) {
      throw new Error('Invalid language code')
    }
  }
}
