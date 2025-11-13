# User Profile Page

## Overview

The User Profile Page allows authenticated users to view and edit their personal information, business details, and location preferences. This page is part of the Supabase integration and provides a comprehensive interface for managing user profile data.

## Features

### 1. Profile Information Display
- Personal details (name, email, phone, language)
- Business information (name, type, category, turnover, employees)
- Location details (state, district, pincode)
- Account metadata (role, member since, last login)

### 2. Edit Functionality
- Toggle between view and edit modes
- Form validation before submission
- Real-time error feedback
- Loading states during operations

### 3. Data Validation
- Email format validation
- Phone number format validation
- Pincode format validation (6 digits)
- Positive numbers for financial fields
- Language code validation

## Usage

### Accessing the Profile Page

```typescript
// Navigate to profile page
import { useRouter } from 'next/navigation'

const router = useRouter()
router.push('/profile')
```

### Route Protection

The `/profile` route is automatically protected by middleware. Unauthenticated users are redirected to `/login`.

### Editing Profile

1. Click "Edit Profile" button
2. Modify desired fields
3. Click "Save Changes" to submit
4. Click "Cancel" to discard changes

## Components

### Main Component
- **Location**: `app/profile/page.tsx`
- **Type**: Client Component
- **Authentication**: Required

### Dependencies
- `useAuth` - Authentication context
- `useProfile` - Profile data management hook
- `shadcn/ui` - UI components
- `lucide-react` - Icons
- `sonner` - Toast notifications

## Form Fields

### Personal Information
| Field | Type | Required | Editable |
|-------|------|----------|----------|
| Full Name | Text | No | Yes |
| Email | Email | Yes | No |
| Phone | Tel | No | Yes |
| Language | Select | Yes | Yes |

### Business Information
| Field | Type | Required | Editable |
|-------|------|----------|----------|
| Business Name | Text | No | Yes |
| Business Type | Select | No | Yes |
| Business Category | Select | No | Yes |
| Employee Count | Number | No | Yes |
| Annual Turnover | Number | No | Yes |

### Location
| Field | Type | Required | Editable |
|-------|------|----------|----------|
| State | Select | No | Yes |
| District | Text | No | Yes |
| Pincode | Text (6 digits) | No | Yes |

## Supported Options

### Languages (12)
- English, Hindi, Bengali, Telugu, Marathi, Tamil
- Gujarati, Kannada, Malayalam, Odia, Punjabi, Urdu

### Business Types (8)
- Sole Proprietorship
- Partnership
- Limited Liability Partnership (LLP)
- Private Limited Company
- Public Limited Company
- One Person Company (OPC)
- Section 8 Company
- Cooperative Society

### Business Categories (12)
- Manufacturing, Trading, Services, Agriculture
- Technology, Healthcare, Education, Construction
- Retail, Hospitality, Transportation, Other

### States (36)
All Indian states and union territories

## API Integration

### Endpoints Used
- `GET /api/profile` - Fetch user profile
- `PATCH /api/profile` - Update user profile

### Data Flow
```
User Input → Form State → useProfile Hook → API Route → Supabase → Database
```

## Testing

### Test Suite
- **Location**: `app/profile/__tests__/profile.test.tsx`
- **Tests**: 23 comprehensive tests
- **Coverage**: Display, Edit, Update, Validation, Authentication

### Running Tests
```bash
npm test -- app/profile/__tests__/profile.test.tsx
```

## Error Handling

### Validation Errors
- Displayed via toast notifications
- Specific error messages for each field
- Form submission blocked until valid

### Network Errors
- User-friendly error messages
- Automatic retry suggestions
- Console logging for debugging

### Authentication Errors
- Automatic redirect to login page
- Preserved redirect URL for return

## Accessibility

- ✅ Semantic HTML with proper labels
- ✅ ARIA attributes for screen readers
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Loading state announcements

## Security

- ✅ Route protected by middleware
- ✅ Email field is read-only
- ✅ User can only edit own profile (RLS)
- ✅ Input validation and sanitization
- ✅ Secure API communication

## Performance

- Lazy loading of profile data
- Optimistic UI updates
- Minimal re-renders
- Efficient state management
- Code splitting

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Future Enhancements

- [ ] Profile picture upload
- [ ] Email change with verification
- [ ] Password change functionality
- [ ] Two-factor authentication
- [ ] Activity log
- [ ] Data export
- [ ] Account deletion
- [ ] District autocomplete
- [ ] Pincode geographic validation
- [ ] Profile completeness indicator

## Related Documentation

- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Supabase Integration Spec](../../.kiro/specs/supabase-integration/)
- [useProfile Hook](../../hooks/README_useProfile.md)
- [ProfileService](../../services/database/README.md)

## Support

For issues or questions:
1. Check the implementation summary
2. Review the test suite for examples
3. Check console logs for errors
4. Verify authentication state
5. Check network requests in DevTools
