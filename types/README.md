# TypeScript Type Definitions

This directory contains TypeScript type definitions for the MSME Mitr application, including Supabase database types and application-specific types.

## Files

### `database.ts`
Contains Supabase database type definitions generated from the database schema. These types provide type safety for all database operations.

**Key Types:**
- `Database` - Main database interface with all tables, views, functions, and enums
- `UserProfile`, `UserProfileInsert`, `UserProfileUpdate` - User profile types
- `Conversation`, `ConversationInsert`, `ConversationUpdate` - Conversation types
- `Message`, `MessageInsert`, `MessageUpdate` - Message types
- `Scheme`, `SchemeInsert`, `SchemeUpdate` - Government scheme types
- `UserScheme`, `UserSchemeInsert`, `UserSchemeUpdate` - User saved scheme types

**Helper Types:**
- `Tables` - Union type of all table names
- `TableRow<T>` - Get row type for a table
- `TableInsert<T>` - Get insert type for a table
- `TableUpdate<T>` - Get update type for a table

### `supabase.ts`
Contains base Supabase types and utilities.

**Key Types:**
- `Json` - Type for JSONB columns
- `SupabaseAuthUser` - Authenticated user type
- `SupabaseSession` - Session type
- `SupabaseError` - Error type
- `SupabaseResponse<T>` - Generic response type

**Type Guards:**
- `isSupabaseError()` - Check if value is a Supabase error
- `hasSupabaseError()` - Check if response has an error
- `hasSupabaseData()` - Check if response has data

### `index.ts`
Main export file that re-exports all types from other files, plus legacy application types.

## Usage Examples

### Using Database Types with Supabase Client

```typescript
import { createClient } from '@/lib/supabase/client'
import type { Database, UserProfile, ConversationInsert } from '@/types/database'

// Create typed Supabase client
const supabase = createClient<Database>()

// Type-safe query
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single()

// data is typed as UserProfile | null
if (data) {
  console.log(data.full_name) // TypeScript knows this property exists
}
```

### Using Insert Types

```typescript
import type { ConversationInsert, MessageInsert } from '@/types/database'

// Create a new conversation
const newConversation: ConversationInsert = {
  user_id: userId,
  session_id: `session_${Date.now()}`,
  title: 'New Chat',
  language: 'en',
  model: 'openai/gpt-4o-mini'
}

const { data, error } = await supabase
  .from('conversations')
  .insert(newConversation)
  .select()
  .single()
```

### Using Update Types

```typescript
import type { UserProfileUpdate } from '@/types/database'

// Update user profile
const updates: UserProfileUpdate = {
  full_name: 'John Doe',
  business_name: 'Acme Corp',
  state: 'Maharashtra',
  updated_at: new Date().toISOString()
}

const { error } = await supabase
  .from('user_profiles')
  .update(updates)
  .eq('id', userId)
```

### Using Helper Types

```typescript
import type { Tables, TableRow, TableInsert } from '@/types/database'

// Get row type for any table
type ConversationRow = TableRow<'conversations'>

// Get insert type for any table
type SchemeInsert = TableInsert<'schemes'>

// Generic function that works with any table
async function getById<T extends Tables>(
  table: T,
  id: string
): Promise<TableRow<T> | null> {
  const { data } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single()
  
  return data
}
```

### Using Joined Query Types

```typescript
import type { ConversationWithMessages } from '@/types/database'

// Fetch conversation with messages
const { data, error } = await supabase
  .from('conversations')
  .select(`
    *,
    messages (*)
  `)
  .eq('id', conversationId)
  .single()

// data is typed as ConversationWithMessages
if (data) {
  console.log(data.title)
  console.log(data.messages.length)
}
```

### Using Type Guards

```typescript
import { hasSupabaseError, hasSupabaseData } from '@/types/supabase'

const response = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single()

if (hasSupabaseError(response)) {
  // TypeScript knows response.error is not null
  console.error(response.error.message)
  return
}

if (hasSupabaseData(response)) {
  // TypeScript knows response.data is not null
  console.log(response.data.full_name)
}
```

## Type Generation

These types are manually created based on the database schema defined in:
- `supabase/migrations/20250110_initial_schema.sql`

If the database schema changes, these types should be updated accordingly.

### Future: Automatic Type Generation

For automatic type generation from the Supabase database, you can use the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Generate types
supabase gen types typescript --linked > types/database.generated.ts
```

## Best Practices

1. **Always use typed clients**: Pass the `Database` type to `createClient<Database>()`
2. **Use Insert types for inserts**: Use `*Insert` types when creating new records
3. **Use Update types for updates**: Use `*Update` types when updating records
4. **Use Row types for queries**: Use `*` types (e.g., `UserProfile`) for query results
5. **Leverage type inference**: Let TypeScript infer types from queries when possible
6. **Use helper types**: Use `TableRow<T>`, `TableInsert<T>`, etc. for generic functions
7. **Handle nulls properly**: Database types include `null` for nullable columns
8. **Use type guards**: Use provided type guards for safer error handling

## Type Safety Benefits

- **Compile-time errors**: Catch typos and invalid queries before runtime
- **IntelliSense**: Get autocomplete for table names, columns, and values
- **Refactoring safety**: Rename columns with confidence
- **Documentation**: Types serve as inline documentation
- **Reduced bugs**: Prevent common database query errors

## Related Documentation

- [Supabase TypeScript Support](https://supabase.com/docs/guides/api/generating-types)
- [Database Schema](../supabase/migrations/20250110_initial_schema.sql)
- [Design Document](../.kiro/specs/supabase-integration/design.md)
