# Authentication UI Components

This directory contains the authentication form components for the MSME Mitr application.

## Components

### LoginForm
A form component for user login with email and password.

**Features:**
- Email and password validation using Zod
- Loading states with spinner
- Error handling with toast notifications
- Automatic redirect to /chat on success
- Accessible form controls

**Usage:**
```tsx
import { LoginForm } from '@/components/auth'

export default function LoginPage() {
  return <LoginForm />
}
```

### SignupForm
A form component for new user registration.

**Features:**
- Full name, email, password, and confirm password fields
- Comprehensive validation using Zod
- Password matching validation
- Loading states with spinner
- Error handling with toast notifications
- Automatic redirect to /chat on success
- Accessible form controls

**Usage:**
```tsx
import { SignupForm } from '@/components/auth'

export default function SignupPage() {
  return <SignupForm />
}
```

### PasswordResetForm
A form component for password reset requests.

**Features:**
- Email validation using Zod
- Loading states with spinner
- Success state with confirmation message
- Error handling with toast notifications
- Security-conscious error messages (doesn't reveal if email exists)
- Accessible form controls

**Usage:**
```tsx
import { PasswordResetForm } from '@/components/auth'

export default function ResetPasswordPage() {
  return <PasswordResetForm />
}
```

## Validation Schemas

All forms use Zod validation schemas defined in `lib/validators/auth.ts`:

- `loginSchema` - Email and password validation
- `signupSchema` - Full name, email, password, and confirm password validation
- `passwordResetSchema` - Email validation

## Dependencies

- `react-hook-form` - Form state management
- `@hookform/resolvers/zod` - Zod integration with react-hook-form
- `zod` - Schema validation
- `sonner` - Toast notifications
- `lucide-react` - Icons (Loader2)
- UI components from `@/components/ui`

## Error Handling

All forms include comprehensive error handling:

1. **Validation Errors**: Displayed inline below each field using FormMessage
2. **API Errors**: Displayed as toast notifications with user-friendly messages
3. **Loading States**: Buttons are disabled and show loading spinner during submission

## Accessibility

All forms follow accessibility best practices:

- Proper label associations
- ARIA attributes for form controls
- Error messages linked to form fields
- Keyboard navigation support
- Focus management
