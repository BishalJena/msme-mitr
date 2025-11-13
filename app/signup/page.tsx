import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
      <div className="w-full" style={{ maxWidth: '28rem' }}>
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join MSME Mitr to discover government schemes</p>
        </div>

        {/* Signup Form Card */}
        <div className="bg-card border rounded-lg shadow-sm p-6 mb-6">
          {/* Form Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Sign up</h2>
            <p className="text-sm text-muted-foreground">
              Create your account to get started
            </p>
          </div>

          {/* Signup Form */}
          <div className="mb-6">
            <SignupForm />
          </div>

          <Separator className="my-6" />

          {/* Login Link */}
          <div>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Already have an account?
            </p>
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full">
                Sign in instead
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{' '}
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
