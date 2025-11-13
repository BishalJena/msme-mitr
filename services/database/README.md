# Database Services

This directory contains service classes for managing database operations with Supabase.

## ConversationService

The `ConversationService` class provides methods for managing conversations in the database.

### Usage

```typescript
import { ConversationService } from '@/services/database'

// Create an instance
const conversationService = new ConversationService()

// Or inject a custom Supabase client (useful for server-side or testing)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const conversationService = new ConversationService(supabase)
```

### Methods

#### `createConversation(userId, title?, language?, model?)`
Creates a new conversation for a user.

```typescript
const conversation = await conversationService.createConversation(
  'user-id',
  'My Chat',
  'en',
  'openai/gpt-4o-mini'
)
```

#### `getConversations(userId, includeArchived?)`
Gets all conversations for a user, ordered by most recent activity.

```typescript
const conversations = await conversationService.getConversations('user-id')
const allConversations = await conversationService.getConversations('user-id', true)
```

#### `getConversation(conversationId)`
Gets a single conversation with all its messages.

```typescript
const conversation = await conversationService.getConversation('conversation-id')
console.log(conversation.messages) // Array of messages
```

#### `updateConversation(conversationId, updates)`
Updates a conversation's properties.

```typescript
const updated = await conversationService.updateConversation('conversation-id', {
  title: 'Updated Title',
  language: 'hi'
})
```

#### `deleteConversation(conversationId)`
Permanently deletes a conversation and all its messages (cascade delete).

```typescript
await conversationService.deleteConversation('conversation-id')
```

#### `archiveConversation(conversationId)`
Archives a conversation (soft delete).

```typescript
const archived = await conversationService.archiveConversation('conversation-id')
```

#### `unarchiveConversation(conversationId)`
Unarchives a conversation.

```typescript
const unarchived = await conversationService.unarchiveConversation('conversation-id')
```

#### `pinConversation(conversationId)`
Pins a conversation to the top of the list.

```typescript
const pinned = await conversationService.pinConversation('conversation-id')
```

#### `unpinConversation(conversationId)`
Unpins a conversation.

```typescript
const unpinned = await conversationService.unpinConversation('conversation-id')
```

#### `getPinnedConversations(userId)`
Gets all pinned conversations for a user.

```typescript
const pinnedConversations = await conversationService.getPinnedConversations('user-id')
```

### Error Handling

All methods throw errors with descriptive messages if operations fail:

```typescript
try {
  const conversation = await conversationService.getConversation('invalid-id')
} catch (error) {
  console.error(error.message) // "Failed to fetch conversation: ..."
}
```

### Type Safety

The service uses TypeScript types from `@/types/database` for full type safety:

- `Conversation` - Full conversation object
- `ConversationInsert` - Data for creating a conversation
- `ConversationUpdate` - Data for updating a conversation
- `ConversationWithMessages` - Conversation with nested messages array

### Requirements Satisfied

This service satisfies the following requirements from the Supabase integration spec:

- **5.1**: Create new conversations
- **5.2**: Save messages to conversations
- **5.3**: Fetch conversation list
- **5.4**: Switch between conversations
- **5.5**: Delete conversations
- **5.6**: Load messages ordered by timestamp

## MessageService

The `MessageService` class provides methods for managing messages within conversations.

### Usage

```typescript
import { MessageService } from '@/services/database'

// Create an instance
const messageService = new MessageService()

// Or inject a custom Supabase client (useful for server-side or testing)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const messageService = new MessageService(supabase)
```

### Methods

#### `addMessage(conversationId, role, content, parts?)`
Adds a new message to a conversation. Automatically increments the conversation's message_count and updates last_active_at.

```typescript
// Add a user message
const message = await messageService.addMessage(
  'conversation-id',
  'user',
  'Hello, how can I apply for this scheme?'
)

// Add an assistant message with AI SDK v5 parts
const assistantMessage = await messageService.addMessage(
  'conversation-id',
  'assistant',
  'I can help you with that!',
  { type: 'text', value: 'Response data' }
)
```

#### `getMessages(conversationId, limit?, offset?)`
Gets all messages for a conversation, ordered by creation time (oldest first).

```typescript
// Get all messages
const messages = await messageService.getMessages('conversation-id')

// Get with limit
const recentMessages = await messageService.getMessages('conversation-id', 50)

// Get with pagination
const pagedMessages = await messageService.getMessages('conversation-id', 20, 40)
```

#### `deleteMessage(messageId)`
Deletes a specific message. Note: This does not decrement the message_count.

```typescript
await messageService.deleteMessage('message-id')
```

#### `updateMessage(messageId, updates)`
Updates a message's content or parts.

```typescript
const updated = await messageService.updateMessage('message-id', {
  content: 'Updated message content'
})
```

#### `getLatestMessage(conversationId)`
Gets the most recent message in a conversation.

```typescript
const latestMessage = await messageService.getLatestMessage('conversation-id')
if (latestMessage) {
  console.log('Last message:', latestMessage.content)
}
```

#### `getMessageCount(conversationId)`
Gets the total number of messages in a conversation.

```typescript
const count = await messageService.getMessageCount('conversation-id')
console.log(`This conversation has ${count} messages`)
```

#### `deleteAllMessages(conversationId)`
Deletes all messages in a conversation. Note: This is typically handled by cascade delete when deleting a conversation.

```typescript
await messageService.deleteAllMessages('conversation-id')
```

### Integration with Conversation Updates

When adding a message, the service automatically:
1. Inserts the message into the `messages` table
2. Calls the `increment_message_count` database function to:
   - Increment the conversation's `message_count`
   - Update the conversation's `last_active_at` timestamp

This ensures conversation metadata stays in sync with messages.

### Error Handling

All methods throw errors with descriptive messages if operations fail:

```typescript
try {
  const message = await messageService.addMessage('invalid-id', 'user', 'Hello')
} catch (error) {
  console.error(error.message) // "Failed to add message: ..."
}
```

### Type Safety

The service uses TypeScript types from `@/types/database` for full type safety:

- `Message` - Full message object
- `MessageInsert` - Data for creating a message
- `MessageUpdate` - Data for updating a message

### Requirements Satisfied

This service satisfies the following requirements from the Supabase integration spec:

- **5.1**: Create new conversations (via message addition)
- **5.2**: Save messages to database
- **5.6**: Load messages ordered by timestamp

### Next Steps

- Implement `ProfileService` for user profile management
- Create React hooks that use these services (`useMessages`, `useConversations`)
- Add API routes that use these services
- Implement real-time message updates (optional)


## ProfileService

The `ProfileService` class provides methods for managing user profiles in the database.

### Usage

```typescript
import { ProfileService } from '@/services/database'

// Create an instance
const profileService = new ProfileService()

// Or inject a custom Supabase client (useful for server-side or testing)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const profileService = new ProfileService(supabase)
```

### Methods

#### `getProfile(userId)`
Gets a user's profile by user ID.

```typescript
const profile = await profileService.getProfile('user-id')
console.log(profile.full_name, profile.business_name)
```

#### `updateProfile(userId, updates)`
Updates a user's profile with validation. Automatically sets the `updated_at` timestamp.

```typescript
const updated = await profileService.updateProfile('user-id', {
  full_name: 'John Doe',
  business_name: 'Acme Corp',
  business_type: 'Manufacturing',
  state: 'Maharashtra',
  district: 'Mumbai',
  pincode: '400001',
  language: 'en'
})
```

#### `updateLastLogin(userId)`
Updates the last login timestamp for a user.

```typescript
const updated = await profileService.updateLastLogin('user-id')
console.log('Last login:', updated.last_login_at)
```

#### `getProfileByEmail(email)`
Gets a user profile by email address. Returns null if not found.

```typescript
const profile = await profileService.getProfileByEmail('user@example.com')
if (profile) {
  console.log('Found user:', profile.full_name)
}
```

#### `hasRole(userId, role)`
Checks if a user has a specific role.

```typescript
const isAdmin = await profileService.hasRole('user-id', 'admin')
const isUser = await profileService.hasRole('user-id', 'user')
```

#### `isAdmin(userId)`
Checks if a user is an admin (admin or super_admin role).

```typescript
const isAdmin = await profileService.isAdmin('user-id')
if (isAdmin) {
  // Show admin features
}
```

### Validation Rules

The `updateProfile` method validates all fields before updating:

- **Email**: Must be valid email format (`user@example.com`)
- **Phone**: Must contain only digits, spaces, hyphens, parentheses, and + prefix
- **Role**: Must be one of: `'user'`, `'admin'`, `'super_admin'`
- **Annual Turnover**: Must be a positive number
- **Employee Count**: Must be a positive integer
- **Pincode**: Must be exactly 6 digits (Indian pincode format)
- **Language**: Must be one of: `'en'`, `'hi'`, `'bn'`, `'te'`, `'mr'`, `'ta'`, `'gu'`, `'kn'`, `'ml'`, `'or'`, `'pa'`, `'ur'`

### Error Handling

All methods throw errors with descriptive messages if operations fail:

```typescript
try {
  await profileService.updateProfile('user-id', {
    email: 'invalid-email' // Will throw validation error
  })
} catch (error) {
  console.error(error.message) // "Invalid email format"
}

try {
  await profileService.updateProfile('user-id', {
    pincode: '12345' // Will throw validation error
  })
} catch (error) {
  console.error(error.message) // "Invalid pincode format. Must be 6 digits"
}
```

### Type Safety

The service uses TypeScript types from `@/types/database` for full type safety:

- `UserProfile` - Full user profile object
- `UserProfileUpdate` - Data for updating a profile

### Requirements Satisfied

This service satisfies the following requirements from the Supabase integration spec:

- **6.1**: Get user profile and update last login
- **6.2**: Update profile with changes saved to database
- **6.3**: Business type validation
- **6.4**: Location fields (state, district)
- **6.5**: Language preference
- **6.6**: Field validation
- **6.7**: Error handling and display
- **6.8**: Display saved profile information

### Integration Examples

#### With AuthContext
```typescript
// In AuthContext.tsx
import { ProfileService } from '@/services/database'

const profileService = new ProfileService(supabase)

async function loadProfile(userId: string) {
  const profile = await profileService.getProfile(userId)
  setProfile(profile)
  
  // Update last login
  await profileService.updateLastLogin(userId)
}
```

#### With API Routes
```typescript
// In app/api/profile/route.ts
import { createClient } from '@/lib/supabase/server'
import { ProfileService } from '@/services/database'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const updates = await request.json()
  const profileService = new ProfileService(supabase)
  
  try {
    const updated = await profileService.updateProfile(user.id, updates)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
```

### Next Steps

- Create `useProfile` React hook that uses this service
- Create API routes for profile operations
- Build user profile page with edit functionality
- Integrate with AuthContext for profile loading
