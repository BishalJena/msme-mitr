# Conversations API Routes

This directory contains the API routes for managing conversations in the MSME Mitr application.

## Endpoints

### GET /api/conversations

Lists all conversations for the authenticated user.

**Query Parameters:**
- `includeArchived` (optional): boolean - Whether to include archived conversations (default: false)

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "string",
      "session_id": "string",
      "language": "string",
      "model": "string",
      "message_count": 0,
      "is_archived": false,
      "is_pinned": false,
      "created_at": "timestamp",
      "last_active_at": "timestamp"
    }
  ],
  "count": 1
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 500: Internal Server Error

---

### POST /api/conversations

Creates a new conversation for the authenticated user.

**Request Body:**
```json
{
  "title": "string (optional, max 200 chars)",
  "language": "string (optional, default: 'en')",
  "model": "string (optional, default: 'openai/gpt-4o-mini')"
}
```

**Response:**
```json
{
  "conversation": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "string",
    "session_id": "string",
    "language": "string",
    "model": "string",
    "message_count": 0,
    "is_archived": false,
    "is_pinned": false,
    "created_at": "timestamp",
    "last_active_at": "timestamp"
  },
  "message": "Conversation created successfully"
}
```

**Status Codes:**
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized
- 500: Internal Server Error

---

### GET /api/conversations/[id]

Retrieves a specific conversation with all its messages.

**Response:**
```json
{
  "conversation": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "string",
    "session_id": "string",
    "language": "string",
    "model": "string",
    "message_count": 0,
    "is_archived": false,
    "is_pinned": false,
    "created_at": "timestamp",
    "last_active_at": "timestamp",
    "messages": [
      {
        "id": "uuid",
        "conversation_id": "uuid",
        "role": "user|assistant|system",
        "content": "string",
        "parts": null,
        "created_at": "timestamp"
      }
    ]
  }
}
```

**Status Codes:**
- 200: Success
- 400: Bad Request (invalid ID)
- 401: Unauthorized
- 403: Forbidden (not conversation owner)
- 404: Not Found
- 500: Internal Server Error

---

### PATCH /api/conversations/[id]

Updates a conversation's properties.

**Request Body (all fields optional):**
```json
{
  "title": "string (max 200 chars)",
  "language": "string",
  "model": "string",
  "is_archived": "boolean",
  "is_pinned": "boolean"
}
```

**Response:**
```json
{
  "conversation": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "string",
    "session_id": "string",
    "language": "string",
    "model": "string",
    "message_count": 0,
    "is_archived": false,
    "is_pinned": false,
    "created_at": "timestamp",
    "last_active_at": "timestamp"
  },
  "message": "Conversation updated successfully"
}
```

**Status Codes:**
- 200: Success
- 400: Bad Request (validation error or no fields to update)
- 401: Unauthorized
- 403: Forbidden (not conversation owner)
- 404: Not Found
- 500: Internal Server Error

---

### DELETE /api/conversations/[id]

Deletes a conversation and all its messages (cascade delete).

**Response:**
- 204 No Content (empty body)

**Status Codes:**
- 204: No Content (success)
- 400: Bad Request (invalid ID)
- 401: Unauthorized
- 403: Forbidden (not conversation owner)
- 404: Not Found
- 500: Internal Server Error

---

## Authentication

All endpoints require authentication. The user must have a valid session token.

## Authorization

Users can only access, modify, or delete their own conversations. Attempting to access another user's conversation will result in a 403 Forbidden response.

## Error Responses

All error responses follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "code": "optional_database_error_code"
}
```

## Implementation Details

- All routes use the `requireAuth` utility to verify authentication
- Ownership verification is performed before any modification operations
- The ConversationService class handles all database operations
- Row Level Security (RLS) policies provide an additional layer of security at the database level
- Input validation is performed on all user-provided data
- Proper HTTP status codes are returned for all scenarios

## Testing

Tests are located in `__tests__/conversations.test.ts` and cover:
- Authentication checks
- Authorization (ownership) checks
- Input validation
- Success scenarios
- Error handling
- Edge cases

Note: Tests may require additional setup for NextResponse mocking in the Jest environment.
