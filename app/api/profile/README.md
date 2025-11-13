# User Profile API Routes

This directory contains API routes for managing user profile information.

## Routes

### GET /api/profile

Retrieves the profile information for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "role": "user",
    "business_name": "My Business",
    "business_type": "Manufacturing",
    "business_category": "MSME",
    "annual_turnover": 5000000,
    "employee_count": 25,
    "state": "Maharashtra",
    "district": "Mumbai",
    "pincode": "400001",
    "language": "en",
    "preferred_model": "openai/gpt-4o-mini",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "last_login_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User is not authenticated
- `500 Internal Server Error` - Failed to fetch profile

### PATCH /api/profile

Updates the profile information for the authenticated user.

**Authentication:** Required

**Request Body:**
All fields are optional. Only include fields you want to update.

```json
{
  "full_name": "John Doe",
  "phone": "+1234567890",
  "business_name": "My Business",
  "business_type": "Manufacturing",
  "business_category": "MSME",
  "annual_turnover": 5000000,
  "employee_count": 25,
  "state": "Maharashtra",
  "district": "Mumbai",
  "pincode": "400001",
  "language": "en",
  "preferred_model": "openai/gpt-4o-mini"
}
```

**Field Validation:**
- `full_name`: string or null, max 100 characters
- `phone`: string or null, max 20 characters, must match phone format
- `business_name`: string or null, max 200 characters
- `business_type`: string or null
- `business_category`: string or null
- `annual_turnover`: number or null, must be positive
- `employee_count`: number or null, must be positive integer
- `state`: string or null
- `district`: string or null
- `pincode`: string or null, must be 6 digits (Indian format)
- `language`: string, must be valid language code (en, hi, bn, te, mr, ta, gu, kn, ml, or, pa, ur)
- `preferred_model`: string

**Protected Fields:**
The following fields cannot be updated via this endpoint:
- `id` - User ID is immutable
- `email` - Email updates require separate verification flow
- `role` - Role changes require admin privileges
- `created_at`, `updated_at`, `last_login_at` - Timestamp fields are auto-managed

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    // ... updated profile data
  },
  "message": "Profile updated successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body or no fields provided
- `401 Unauthorized` - User is not authenticated
- `422 Unprocessable Entity` - Validation failed for one or more fields
- `500 Internal Server Error` - Failed to update profile

## Usage Examples

### Fetch User Profile

```typescript
const response = await fetch('/api/profile', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})

const { profile } = await response.json()
```

### Update User Profile

```typescript
const response = await fetch('/api/profile', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    full_name: 'Jane Doe',
    business_name: 'Updated Business Name',
    state: 'Karnataka',
    language: 'kn',
  }),
})

const { profile, message } = await response.json()
```

### Update Single Field

```typescript
const response = await fetch('/api/profile', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    language: 'hi',
  }),
})

const { profile } = await response.json()
```

## Security

- All routes require authentication via Supabase Auth
- Users can only access and update their own profile
- Row Level Security (RLS) policies enforce data access control
- Sensitive fields (role, email) are protected from updates
- Input validation prevents invalid data from being stored
- The ProfileService performs additional validation on the server side

## Implementation Details

- Uses `requireAuth` utility for authentication checks
- Leverages `ProfileService` for database operations
- Validates all input fields before processing
- Returns standardized error responses
- Automatically updates `updated_at` timestamp
- Server-side Supabase client ensures secure database access

## Related Files

- `/services/database/profileService.ts` - Profile database service
- `/lib/api/auth.ts` - Authentication utilities
- `/types/database.ts` - TypeScript type definitions
- `/hooks/useProfile.ts` - React hook for profile management
