import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
      <div className="w-full" style={{ maxWidth: '28rem' }}>
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your MSME Mitr account</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-card border rounded-lg shadow-sm p-6 mb-6">
          {/* Form Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Enter your email and password to access your account
            </p>
          </div>

          {/* Login Form */}
          <div className="mb-6">
            <LoginForm />
          </div>

          {/* Forgot Password Link */}
          <div className="text-center mb-6">
            <Link href="/reset-password" className="text-sm text-primary hover:underline">
              Forgot your password?
            </Link>
          </div>

          <Separator className="my-6" />

          {/* Signup Link */}
          <div>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Don't have an account?
            </p>
            <Link href="/signup" className="block">
              <Button variant="outline" className="w-full">
                Create an account
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
