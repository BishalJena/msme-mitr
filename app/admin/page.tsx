'use client'

/**
 * Admin Index Page
 * 
 * Redirects to the dashboard page
 * 
 * @module app/admin/page
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

export default function AdminIndexPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard
    router.push('/admin/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Spinner className="h-8 w-8 mx-auto" />
        <p className="text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
