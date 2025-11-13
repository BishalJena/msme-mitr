/**
 * Test Setup for Database Services
 * 
 * This file contains utilities for setting up and tearing down test data
 * in the Supabase database for integration tests.
 */

import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export const TEST_USER_ID = 'test-user-' + Date.now()
export const TEST_EMAIL = `test-${Date.now()}@example.com`

let supabaseClient: SupabaseClient | null = null

/**
 * Get or create a Supabase client for tests
 */
export function getTestClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}

/**
 * Create a test user profile
 */
export async function createTestUserProfile() {
  const client = getTestClient()
  
  const { data, error } = await client
    .from('user_profiles')
    .insert({
      id: TEST_USER_ID,
      email: TEST_EMAIL,
      full_name: 'Test User',
      role: 'user',
      language: 'en',
      preferred_model: 'openai/gpt-4o-mini',
    })
    .select()
    .single()

  if (error && !error.message.includes('duplicate')) {
    console.error('Failed to create test user:', error)
  }

  return data
}

/**
 * Clean up test user profile
 */
export async function cleanupTestUserProfile() {
  const client = getTestClient()
  
  // Delete user profile (this will cascade delete conversations and messages)
  await client
    .from('user_profiles')
    .delete()
    .eq('id', TEST_USER_ID)
}

/**
 * Clean up test conversations
 */
export async function cleanupTestConversations() {
  const client = getTestClient()
  
  await client
    .from('conversations')
    .delete()
    .eq('user_id', TEST_USER_ID)
}

/**
 * Setup function to run before all tests
 */
export async function setupTests() {
  await createTestUserProfile()
}

/**
 * Teardown function to run after all tests
 */
export async function teardownTests() {
  await cleanupTestUserProfile()
}
