# Messages API Routes

API endpoints for managing messages within conversations.

## Endpoints

### POST /api/conversations/[id]/messages

Add a new message to a conversation.

**Authentication:** Required

**Request Body:**
```json
{
  "role": "user" | "assistant" | "system",
  "content": "Message content",
  "parts": {} // Optional, for AI SDK v5 support
}
```

**Validation:**
- `role`: Required, must be one of: "user", "assistant", "system"
- `content`: Required, non-empty string, max 50,000 characters
- `parts`: Optional, must be an object or array if provided

**Response (201 Created):**
```json
{
  "message": {
    "id": "msg-123",
    "conversation_id": "conv-123",
    "role": "user",
    "content": "Hello, world!",
    "parts": null,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Side Effects:**
- Automatically increments conversation's `message_count`
- Updates conversation's `last_active_at` timestamp
- If first user message, may auto-generate conversation title

**Error Responses:**
- `400 Bad Request`: Invalid or missing required fields
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User does not own the conversation
- `404 Not Found`: Conversation not found
- `500 Internal Server Error`: Database operation failed

---

### GET /api/conversations/[id]/messages

Retrieve all messages in a conversation.

**Authentication:** Required

**Query Parameters:**
- `limit` (optional): Maximum number of messages to return (1-1000)
- `offset` (optional): Number of messages to skip (for pagination)

**Response (200 OK):**
```json
{
  "messages": [
    {
      "id": "msg-1",
      "conversation_id": "conv-123",
      "role": "user",
      "content": "Hello",
      "parts": null,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "msg-2",
      "conversation_id": "conv-123",
      "role": "assistant",
      "content": "Hi there!",
      "parts": null,
      "created_at": "2024-01-01T00:01:00Z"
    }
  ],
  "count": 2,
  "limit": 10,    // Only included if limit was specified
  "offset": 0     // Only included if offset was specified
}
```

**Notes:**
- Messages are returned in chronological order (oldest first)
- Empty array returned if no messages exist
- RLS policies ensure users can only access their own conversation messages

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User does not own the conversation
- `404 Not Found`: Conversation not found
- `500 Internal Server Error`: Database operation failed

---

## Security

- All endpoints require authentication via Supabase Auth
- Row Level Security (RLS) policies enforce data access control
- Users can only add/view messages in conversations they own
- Conversation ownership is verified before any operation

## Usage Examples

### Add a user message
```typescript
const response = await fetch('/api/conversations/conv-123/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    role: 'user',
    content: 'What schemes are available for my business?',
  }),
})

const { message } = await response.json()
```

### Add an assistant message with parts
```typescript
const response = await fetch('/api/conversations/conv-123/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    role: 'assistant',
    content: 'Here are some schemes...',
    parts: {
      type: 'text',
      value: 'Detailed response',
    },
  }),
})
```

### Get all messages
```typescript
const response = await fetch('/api/conversations/conv-123/messages')
const { messages, count } = await response.json()
```

### Get messages with pagination
```typescript
const response = await fetch('/api/conversations/conv-123/messages?limit=20&offset=40')
const { messages, count, limit, offset } = await response.json()
```

## Implementation Details

- Uses `MessageService` for database operations
- Uses `ConversationService` to verify conversation ownership
- Integrates with database function `increment_message_count` for atomic updates
- Supports AI SDK v5 `parts` field for structured message content
- Proper error handling with standardized error responses
