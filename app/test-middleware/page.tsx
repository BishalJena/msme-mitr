/**
 * Test page for middleware verification
 * This page helps verify that middleware is working correctly
 * 
 * Access this page at: /test-middleware
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TestMiddlewarePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // This page is not in the protected routes list, so it should be accessible
  // But we can check auth status here

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Middleware Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          
          {user ? (
            <div className="space-y-2">
              <p className="text-green-600 font-semibold">✅ Authenticated</p>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-red-600 font-semibold">❌ Not Authenticated</p>
              {error && (
                <div className="bg-red-50 p-4 rounded">
                  <p className="text-red-700"><strong>Error:</strong> {error.message}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Links</h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2">Protected Routes (Should redirect to /login if not authenticated):</h3>
              <ul className="space-y-2 ml-4">
                <li>
                  <a href="/chat" className="text-blue-600 hover:underline">
                    /chat - Chat Interface
                  </a>
                </li>
                <li>
                  <a href="/profile" className="text-blue-600 hover:underline">
                    /profile - User Profile
                  </a>
                </li>
                <li>
                  <a href="/dashboard" className="text-blue-600 hover:underline">
                    /dashboard - Dashboard
                  </a>
                </li>
                <li>
                  <a href="/applications" className="text-blue-600 hover:underline">
                    /applications - Applications
                  </a>
                </li>
                <li>
                  <a href="/eligibility" className="text-blue-600 hover:underline">
                    /eligibility - Eligibility Check
                  </a>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <h3 className="font-semibold mb-2">Auth Routes (Should redirect to /chat if authenticated):</h3>
              <ul className="space-y-2 ml-4">
                <li>
                  <a href="/login" className="text-blue-600 hover:underline">
                    /login - Login Page
                  </a>
                </li>
                <li>
                  <a href="/signup" className="text-blue-600 hover:underline">
                    /signup - Signup Page
                  </a>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <h3 className="font-semibold mb-2">Public Routes (Should be accessible without authentication):</h3>
              <ul className="space-y-2 ml-4">
                <li>
                  <a href="/" className="text-blue-600 hover:underline">
                    / - Home Page
                  </a>
                </li>
                <li>
                  <a href="/schemes" className="text-blue-600 hover:underline">
                    /schemes - Schemes List
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Expected Behavior</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-green-600">✅ When NOT authenticated:</h3>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Clicking protected routes should redirect to /login</li>
                <li>Auth routes should be accessible</li>
                <li>Public routes should be accessible</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-green-600">✅ When authenticated:</h3>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Protected routes should be accessible</li>
                <li>Auth routes should redirect to /chat</li>
                <li>Public routes should be accessible</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This test page is not in the protected routes list, 
            so it's accessible regardless of authentication status. This allows you to 
            test the middleware behavior from both authenticated and unauthenticated states.
          </p>
        </div>
      </div>
    </div>
  )
}
