import Link from 'next/link'
import { PasswordResetForm } from '@/components/auth/PasswordResetForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
      <div className="w-full" style={{ maxWidth: '28rem' }}>
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Password Reset Form Card */}
        <div className="bg-card border rounded-lg shadow-sm p-6 mb-6">
          {/* Form Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Forgot password?</h2>
            <p className="text-sm text-muted-foreground">
              We'll send you a link to reset your password
            </p>
          </div>

          {/* Password Reset Form */}
          <div className="mb-6">
            <PasswordResetForm />
          </div>

          {/* Back to Login Button */}
          <Link href="/login" className="block">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Remember your password?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
