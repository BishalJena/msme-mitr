import { createClient } from '@/lib/supabase/client'
import type {
  UserProfile,
  UserProfileUpdate,
} from '@/types/database'

/**
 * Service class for managing user profile-related database operations
 * Handles CRUD operations for user profiles with proper error handling and validation
 */
export class ProfileService {
  private supabase: ReturnType<typeof createClient>

  constructor(supabaseClient?: ReturnType<typeof createClient>) {
    // Allow injection of Supabase client for testing or server-side usage
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Get a user's profile by user ID
   * @param userId - The ID of the user
   * @returns The user profile
   * @throws Error if fetch fails or profile not found
   */
  async getProfile(userId: string): Promise<UserProfile> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch profile: ${error.message}`)
      }

      if (!data) {
        throw new Error('Profile not found')
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while fetching profile')
    }
  }

  /**
   * Update a user's profile with validation
   * @param userId - The ID of the user
   * @param updates - Partial profile data to update
   * @returns The updated profile
   * @throws Error if validation fails or update fails
   */
  async updateProfile(
    userId: string,
    updates: UserProfileUpdate
  ): Promise<UserProfile> {
    try {
      // Validate updates before sending to database
      this.validateProfileUpdates(updates)

      // Add updated_at timestamp
      const updateData: UserProfileUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await (this.supabase
        .from('user_profiles') as any)
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data returned from profile update')
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while updating profile')
    }
  }

  /**
   * Update the last login timestamp for a user
   * @param userId - The ID of the user
   * @returns The updated profile
   * @throws Error if update fails
   */
  async updateLastLogin(userId: string): Promise<UserProfile> {
    try {
      const { data, error} = await (this.supabase
        .from('user_profiles') as any)
        .update({
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update last login: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data returned from last login update')
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while updating last login')
    }
  }

  /**
   * Validate profile updates before sending to database
   * @param updates - Profile updates to validate
   * @throws Error if validation fails
   */
  private validateProfileUpdates(updates: UserProfileUpdate): void {
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

  /**
   * Get profile by email
   * @param email - The email address to search for
   * @returns The user profile or null if not found
   * @throws Error if fetch fails
   */
  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (error) {
        throw new Error(`Failed to fetch profile by email: ${error.message}`)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while fetching profile by email')
    }
  }

  /**
   * Check if a user has a specific role
   * @param userId - The ID of the user
   * @param role - The role to check for
   * @returns True if user has the role, false otherwise
   * @throws Error if fetch fails
   */
  async hasRole(userId: string, role: 'user' | 'admin' | 'super_admin'): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId)
      return profile.role === role
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while checking user role')
    }
  }

  /**
   * Check if a user is an admin (admin or super_admin)
   * @param userId - The ID of the user
   * @returns True if user is an admin, false otherwise
   * @throws Error if fetch fails
   */
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId)
      return profile.role === 'admin' || profile.role === 'super_admin'
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while checking admin status')
    }
  }
}
