'use client'

/**
 * Admin Test Page
 * 
 * Simple page to test admin authentication and API access
 */

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminTestPage() {
  const { user, profile } = useAuth()
  const [apiTest, setApiTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/analytics/summary')
      const data = await response.json()
      setApiTest({ status: response.status, data })
    } catch (error) {
      setApiTest({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Admin Test Page</h1>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
            <div className="space-y-2 text-sm">
              <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong>Profile Role:</strong> {profile?.role || 'No profile'}</p>
              <p><strong>Is Admin:</strong> {profile?.role === 'admin' || profile?.role === 'super_admin' ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">API Test</h2>
            <button
              onClick={testAPI}
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Summary API'}
            </button>
            {apiTest && (
              <pre className="mt-4 p-4 bg-muted rounded-md overflow-auto text-xs">
                {JSON.stringify(apiTest, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
