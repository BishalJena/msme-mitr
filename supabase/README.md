# Supabase Database Schema

This directory contains the database migration files for the MSME Mitr Supabase integration.

## Migration Files

### `20250110_initial_schema.sql`
Initial database schema including:
- **user_profiles**: Extended user profile information
- **conversations**: User chat conversations
- **messages**: Individual messages within conversations
- **schemes**: Government schemes reference data
- **user_schemes**: User saved/favorited schemes

## Applying Migrations

### Option 1: Supabase Dashboard (Recommended for initial setup)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `migrations/20250110_initial_schema.sql`
4. Paste and run the SQL

### Option 2: Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Option 3: Manual psql
```bash
psql -h your-db-host -U postgres -d postgres -f migrations/20250110_initial_schema.sql
```

## Schema Overview

### Tables Created

1. **user_profiles**
   - Extends auth.users with business and profile information
   - Includes role-based access control (user, admin, super_admin)
   - Stores business details, location, and preferences

2. **conversations**
   - Stores user chat conversations
   - Tracks message count and activity
   - Supports archiving and pinning

3. **messages**
   - Individual messages within conversations
   - Supports AI SDK v5 with JSONB parts field
   - Cascade deletes with conversations

4. **schemes**
   - Government schemes reference data
   - Flexible JSONB fields for scheme details
   - Full-text search support via GIN indexes

5. **user_schemes**
   - User saved/favorited schemes
   - Application status tracking
   - Unique constraint per user-scheme pair

### Indexes Created

Performance optimization indexes:
- User profile lookups by role and email
- Conversation queries by user and activity
- Message queries by conversation and timestamp
- Scheme searches by category, tags, and status
- User scheme lookups by user and status

## Next Steps

After applying the migration:
1. ✅ Enable Row Level Security (RLS) policies - See `RLS_DOCUMENTATION.md`
2. ✅ Create database functions and triggers - Applied in `20250110_functions_triggers.sql`
3. Generate TypeScript types (see task 5)

## Row Level Security (RLS)

RLS policies have been implemented to ensure data security. See `RLS_DOCUMENTATION.md` for complete details.

### Quick RLS Setup

Apply the RLS policies migration:

```bash
# Via Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of migrations/20250110_rls_policies.sql
# 3. Run the SQL

# Via Supabase CLI
supabase db push
```

### Verify RLS Setup

Run the test script to verify policies are working:

```bash
# In Supabase SQL Editor, run:
# migrations/test_rls_policies.sql
```

### Key Security Features

- **User Isolation**: Users can only access their own conversations and messages
- **Admin Access**: Admins can view all data for support/moderation
- **Scheme Management**: Only admins can create/modify schemes
- **Cascade Protection**: Deleting conversations automatically removes messages

## Database Functions and Triggers

Automated database operations have been implemented:

### Functions Created

1. **handle_new_user()** - Auto-creates user profile on signup
2. **handle_updated_at()** - Auto-updates timestamps on row updates
3. **handle_new_message()** - Auto-increments message count
4. **update_conversation_title()** - Auto-generates title from first message
5. **update_last_login()** - Updates last login timestamp
6. **get_user_conversations()** - Helper to fetch user conversations
7. **get_conversation_with_messages()** - Helper to fetch conversation with messages

### Triggers Created

- Auto profile creation on user signup
- Auto timestamp updates on user_profiles, schemes, user_schemes
- Auto message count increment on message insert
- Auto conversation title generation from first message

Test with: `test_functions_triggers.sql`

## Verification

To verify the schema was created correctly:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'conversations', 'messages', 'schemes', 'user_schemes');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'conversations', 'messages', 'schemes', 'user_schemes');

-- Check constraints
SELECT conname, contype, conrelid::regclass 
FROM pg_constraint 
WHERE conrelid IN (
  'user_profiles'::regclass,
  'conversations'::regclass,
  'messages'::regclass,
  'schemes'::regclass,
  'user_schemes'::regclass
);
```
