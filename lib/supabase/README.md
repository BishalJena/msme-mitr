# Supabase Client Configuration

This directory contains the Supabase client configuration for the MSME Mitr application, following Next.js App Router best practices with proper SSR support.

## Files

### `client.ts`
Client-side Supabase client for use in Client Components. This client:
- Uses `createBrowserClient` from `@supabase/ssr`
- Automatically handles authentication state in the browser
- Manages cookies for session persistence
- Should be used in components marked with `'use client'`

**Usage:**
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

export function MyComponent() {
  const supabase = createClient()
  
  // Use the client for queries
  const { data } = await supabase.from('table').select()
}
```

### `server.ts`
Server-side Supabase client for use in Server Components, Server Actions, and Route Handlers. This client:
- Uses `createServerClient` from `@supabase/ssr`
- Properly handles cookies for SSR authentication
- Supports Next.js 14+ App Router cookie handling
- Should be used in server contexts (Server Components, API routes, Server Actions)

**Usage:**
```typescript
import { createClient } from '@/lib/supabase/server'

export async function MyServerComponent() {
  const supabase = await createClient()
  
  // Use the client for queries
  const { data } = await supabase.from('table').select()
}
```

## Environment Variables

Required environment variables (set in `.env` or `.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings > API
4. Copy the Project URL and anon/public key

## Cookie Handling

The server client properly handles cookies for SSR:
- `getAll()`: Retrieves all cookies from the Next.js cookie store
- `setAll()`: Sets cookies with proper options (httpOnly, secure, sameSite)
- Includes error handling for Server Component contexts where cookie setting may fail

## Testing

### Test API Route
Visit `/api/test-supabase` to test server-side client initialization.

### Test Page
Visit `/test-supabase-client` to test both client-side and server-side initialization.

### Manual Testing
```typescript
// Test client-side
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
const { data } = await supabase.auth.getSession()

// Test server-side
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data } = await supabase.auth.getSession()
```

## TypeScript Support

Both clients are typed with the `Database` type from `@/types/database`, providing:
- Full type safety for database queries
- Autocomplete for table names and columns
- Type checking for insert/update operations
- Proper return types for queries

## Security Notes

- The anon key is safe to expose to the client (it's public)
- Row Level Security (RLS) policies protect data access
- Never expose the service role key to the client
- All sensitive operations should use RLS policies

## Next Steps

After setting up the clients:
1. Implement authentication middleware (Task 7)
2. Create authentication context provider (Task 8)
3. Build database service layer (Tasks 11-13)
4. Create custom React hooks (Tasks 14-16)
