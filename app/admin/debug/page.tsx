'use client'

/**
 * Admin Debug Page
 * 
 * Simple page to debug authentication and profile loading
 * 
 * @module app/admin/debug/page
 */

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminDebugPage() {
  const { user, profile, loading } = useAuth()
  const [directProfile, setDirectProfile] = useState<any>(null)
  const [directError, setDirectError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      // Try to load profile directly
      const supabase = createClient()
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            setDirectError(error.message)
          } else {
            setDirectProfile(data)
          }
        })
    }
  }, [user])

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Admin Debug Page</h1>

        {/* Auth Context State */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Auth Context State</h2>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Loading:</span>
              <span className={loading ? 'text-yellow-500' : 'text-green-500'}>
                {loading ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">User:</span>
              <span className={user ? 'text-green-500' : 'text-red-500'}>
                {user ? 'Authenticated' : 'Not authenticated'}
              </span>
            </div>

            {user && (
              <div className="ml-4 space-y-1 text-sm">
                <div>ID: {user.id}</div>
                <div>Email: {user.email}</div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="font-medium">Profile:</span>
              <span className={profile ? 'text-green-500' : 'text-red-500'}>
                {profile ? 'Loaded' : 'Not loaded'}
              </span>
            </div>

            {profile && (
              <div className="ml-4 space-y-1 text-sm">
                <div>ID: {profile.id}</div>
                <div>Email: {profile.email}</div>
                <div>Role: {profile.role}</div>
                <div>Language: {profile.language}</div>
              </div>
            )}
          </div>
        </div>

        {/* Direct Query Result */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Direct Profile Query</h2>
          
          {!user && (
            <p className="text-muted-foreground">No user authenticated</p>
          )}

          {user && !directProfile && !directError && (
            <p className="text-yellow-500">Loading...</p>
          )}

          {directError && (
            <div className="text-red-500">
              <p className="font-medium">Error:</p>
              <p className="text-sm">{directError}</p>
            </div>
          )}

          {directProfile && (
            <div className="space-y-1 text-sm">
              <div>ID: {directProfile.id}</div>
              <div>Email: {directProfile.email}</div>
              <div>Role: {directProfile.role}</div>
              <div>Language: {directProfile.language}</div>
              <div>Created: {new Date(directProfile.created_at).toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Raw JSON */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Raw Data (JSON)</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">User:</h3>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">Profile:</h3>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">Direct Profile:</h3>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                {JSON.stringify(directProfile, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Console Logs */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Instructions</h2>
          <div className="space-y-2 text-sm">
            <p>1. Open browser console (F12)</p>
            <p>2. Look for [AuthContext] log messages</p>
            <p>3. Check if profile is loading correctly</p>
            <p>4. Verify the role is 'admin' or 'super_admin'</p>
          </div>
        </div>
      </div>
    </div>
  )
}
