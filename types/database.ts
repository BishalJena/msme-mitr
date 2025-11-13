// Supabase Database Type Definitions
// Auto-generated types based on database schema

// Json type for JSONB columns
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// Database Interface
// ============================================================================

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: UserProfileInsert
        Update: UserProfileUpdate
      }
      conversations: {
        Row: Conversation
        Insert: ConversationInsert
        Update: ConversationUpdate
      }
      messages: {
        Row: Message
        Insert: MessageInsert
        Update: MessageUpdate
      }
      schemes: {
        Row: Scheme
        Insert: SchemeInsert
        Update: SchemeUpdate
      }
      user_schemes: {
        Row: UserScheme
        Insert: UserSchemeInsert
        Update: UserSchemeUpdate
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_message_count: {
        Args: { conversation_id: string }
        Returns: void
      }
    }
    Enums: {
      user_role: 'user' | 'admin' | 'super_admin'
      message_role: 'user' | 'assistant' | 'system'
      scheme_status: 'saved' | 'applied' | 'approved' | 'rejected'
    }
  }
}

// ============================================================================
// User Profile Types
// ============================================================================

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: 'user' | 'admin' | 'super_admin'
  
  // Business Information
  business_name: string | null
  business_type: string | null
  business_category: string | null
  annual_turnover: number | null
  employee_count: number | null
  
  // Location
  state: string | null
  district: string | null
  pincode: string | null
  
  // Preferences
  language: string
  preferred_model: string
  
  // Metadata
  created_at: string
  updated_at: string
  last_login_at: string | null
}

export interface UserProfileInsert {
  id: string
  email: string
  full_name?: string | null
  phone?: string | null
  role?: 'user' | 'admin' | 'super_admin'
  
  // Business Information
  business_name?: string | null
  business_type?: string | null
  business_category?: string | null
  annual_turnover?: number | null
  employee_count?: number | null
  
  // Location
  state?: string | null
  district?: string | null
  pincode?: string | null
  
  // Preferences
  language?: string
  preferred_model?: string
  
  // Metadata (auto-generated, optional on insert)
  created_at?: string
  updated_at?: string
  last_login_at?: string | null
}

export interface UserProfileUpdate {
  email?: string
  full_name?: string | null
  phone?: string | null
  role?: 'user' | 'admin' | 'super_admin'
  
  // Business Information
  business_name?: string | null
  business_type?: string | null
  business_category?: string | null
  annual_turnover?: number | null
  employee_count?: number | null
  
  // Location
  state?: string | null
  district?: string | null
  pincode?: string | null
  
  // Preferences
  language?: string
  preferred_model?: string
  
  // Metadata
  updated_at?: string
  last_login_at?: string | null
}

// ============================================================================
// Conversation Types
// ============================================================================

export interface Conversation {
  id: string
  user_id: string
  
  // Conversation Details
  title: string
  session_id: string
  language: string
  model: string
  
  // Metadata
  message_count: number
  is_archived: boolean
  is_pinned: boolean
  
  // Timestamps
  created_at: string
  last_active_at: string
}

export interface ConversationInsert {
  id?: string
  user_id: string
  
  // Conversation Details
  title?: string
  session_id: string
  language?: string
  model?: string
  
  // Metadata
  message_count?: number
  is_archived?: boolean
  is_pinned?: boolean
  
  // Timestamps (auto-generated, optional on insert)
  created_at?: string
  last_active_at?: string
}

export interface ConversationUpdate {
  user_id?: string
  
  // Conversation Details
  title?: string
  session_id?: string
  language?: string
  model?: string
  
  // Metadata
  message_count?: number
  is_archived?: boolean
  is_pinned?: boolean
  
  // Timestamps
  last_active_at?: string
}

// Conversation with messages (for joined queries)
export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

// ============================================================================
// Message Types
// ============================================================================

export interface Message {
  id: string
  conversation_id: string
  
  // Message Content
  role: 'user' | 'assistant' | 'system'
  content: string
  
  // AI SDK v5 Support
  parts: Json | null
  
  // Metadata
  created_at: string
}

export interface MessageInsert {
  id?: string
  conversation_id: string
  
  // Message Content
  role: 'user' | 'assistant' | 'system'
  content: string
  
  // AI SDK v5 Support
  parts?: Json | null
  
  // Metadata (auto-generated, optional on insert)
  created_at?: string
}

export interface MessageUpdate {
  conversation_id?: string
  
  // Message Content
  role?: 'user' | 'assistant' | 'system'
  content?: string
  
  // AI SDK v5 Support
  parts?: Json | null
}

// ============================================================================
// Scheme Types
// ============================================================================

export interface Scheme {
  id: string
  
  // Scheme Information
  scheme_name: string
  scheme_url: string | null
  ministry: string | null
  description: string | null
  category: string | null
  
  // Details (JSONB for flexibility)
  details: Json | null
  benefits: Json | null
  eligibility: Json | null
  application_process: Json | null
  documents_required: Json | null
  financial_details: Json | null
  
  // Metadata
  tags: string[] | null
  target_audience: string[] | null
  is_active: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface SchemeInsert {
  id?: string
  
  // Scheme Information
  scheme_name: string
  scheme_url?: string | null
  ministry?: string | null
  description?: string | null
  category?: string | null
  
  // Details (JSONB for flexibility)
  details?: Json | null
  benefits?: Json | null
  eligibility?: Json | null
  application_process?: Json | null
  documents_required?: Json | null
  financial_details?: Json | null
  
  // Metadata
  tags?: string[] | null
  target_audience?: string[] | null
  is_active?: boolean
  
  // Timestamps (auto-generated, optional on insert)
  created_at?: string
  updated_at?: string
}

export interface SchemeUpdate {
  // Scheme Information
  scheme_name?: string
  scheme_url?: string | null
  ministry?: string | null
  description?: string | null
  category?: string | null
  
  // Details (JSONB for flexibility)
  details?: Json | null
  benefits?: Json | null
  eligibility?: Json | null
  application_process?: Json | null
  documents_required?: Json | null
  financial_details?: Json | null
  
  // Metadata
  tags?: string[] | null
  target_audience?: string[] | null
  is_active?: boolean
  
  // Timestamps
  updated_at?: string
}

// ============================================================================
// User Scheme Types
// ============================================================================

export interface UserScheme {
  id: string
  user_id: string
  scheme_id: string
  
  // Status
  status: 'saved' | 'applied' | 'approved' | 'rejected'
  notes: string | null
  
  // Timestamps
  saved_at: string
  updated_at: string
}

export interface UserSchemeInsert {
  id?: string
  user_id: string
  scheme_id: string
  
  // Status
  status?: 'saved' | 'applied' | 'approved' | 'rejected'
  notes?: string | null
  
  // Timestamps (auto-generated, optional on insert)
  saved_at?: string
  updated_at?: string
}

export interface UserSchemeUpdate {
  user_id?: string
  scheme_id?: string
  
  // Status
  status?: 'saved' | 'applied' | 'approved' | 'rejected'
  notes?: string | null
  
  // Timestamps
  updated_at?: string
}

// User scheme with full scheme details (for joined queries)
export interface UserSchemeWithDetails extends UserScheme {
  scheme: Scheme
}

// ============================================================================
// Helper Types
// ============================================================================

// Type for database query results
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never
export type DbResultErr = { error: { message: string; details?: string; hint?: string; code?: string } }

// Type for table names
export type Tables = keyof Database['public']['Tables']

// Type for getting a table's row type
export type TableRow<T extends Tables> = Database['public']['Tables'][T]['Row']

// Type for getting a table's insert type
export type TableInsert<T extends Tables> = Database['public']['Tables'][T]['Insert']

// Type for getting a table's update type
export type TableUpdate<T extends Tables> = Database['public']['Tables'][T]['Update']
