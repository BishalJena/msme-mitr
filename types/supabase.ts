// Supabase Base Types
// These types are used by the database type definitions

// Import Json type from database.ts to avoid duplication
import type { Json } from './database'

// Supabase client types
export interface SupabaseAuthUser {
  id: string
  aud: string
  role?: string
  email?: string
  email_confirmed_at?: string
  phone?: string
  confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: {
    provider?: string
    providers?: string[]
    [key: string]: any
  }
  user_metadata: {
    [key: string]: any
  }
  identities?: Array<{
    id: string
    user_id: string
    identity_data?: {
      [key: string]: any
    }
    provider: string
    last_sign_in_at?: string
    created_at?: string
    updated_at?: string
  }>
  created_at: string
  updated_at?: string
}

// Supabase session type
export interface SupabaseSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: SupabaseAuthUser
}

// Supabase error type
export interface SupabaseError {
  message: string
  status?: number
  statusCode?: number
  code?: string
  details?: string
  hint?: string
}

// Supabase response types
export interface SupabaseResponse<T> {
  data: T | null
  error: SupabaseError | null
}

export interface SupabaseAuthResponse {
  data: {
    user: SupabaseAuthUser | null
    session: SupabaseSession | null
  }
  error: SupabaseError | null
}

// Supabase query builder types
export type SupabaseFilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'is'
  | 'in'
  | 'cs'
  | 'cd'
  | 'sl'
  | 'sr'
  | 'nxl'
  | 'nxr'
  | 'adj'
  | 'ov'
  | 'fts'
  | 'plfts'
  | 'phfts'
  | 'wfts'

export type SupabaseOrderByDirection = 'asc' | 'desc'

// Supabase realtime types
export interface SupabaseRealtimePayload<T = any> {
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
  schema: string
  table: string
}

export interface SupabaseRealtimeChannel {
  subscribe: (callback: (payload: SupabaseRealtimePayload) => void) => void
  unsubscribe: () => void
}

// Supabase storage types
export interface SupabaseStorageObject {
  name: string
  id?: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  metadata?: Record<string, any>
}

export interface SupabaseStorageError {
  message: string
  statusCode?: string
}

// Utility types for Supabase operations
export type SupabaseTable = string
export type SupabaseColumn = string
export type SupabaseValue = string | number | boolean | null | Json

// Type guards
export function isSupabaseError(error: any): error is SupabaseError {
  return error && typeof error.message === 'string'
}

export function hasSupabaseError<T>(
  response: SupabaseResponse<T>
): response is { data: null; error: SupabaseError } {
  return response.error !== null
}

export function hasSupabaseData<T>(
  response: SupabaseResponse<T>
): response is { data: T; error: null } {
  return response.data !== null && response.error === null
}
