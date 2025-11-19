'use client'

/**
 * Admin Users Page
 * 
 * Displays table of users with extracted attributes:
 * - User attributes table with pagination
 * - Filters (same as dashboard)
 * - Search functionality
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * @module app/admin/users/page
 */

import { useState, useEffect } from 'react'
import { FilterPanel } from '@/components/admin/FilterPanel'
import { UserAttributesTable } from '@/components/admin/UserAttributesTable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle, Search } from 'lucide-react'
import type { AnalyticsFilters, UserAttributeWithUser } from '@/types/database'

// ============================================================================
// Component
// ============================================================================

export default function AdminUsersPage() {
  // State
  const [users, setUsers] = useState<UserAttributeWithUser[]>([])
  const [filters, setFilters] = useState<AnalyticsFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  /**
   * Fetch user attributes
   */
  const fetchUsers = async (
    appliedFilters: AnalyticsFilters = {},
    page: number = 1,
    search: string = ''
  ) => {
    try {
      setLoading(true)
      setError(null)

      console.log('[AdminUsersPage] Fetching users with:', { appliedFilters, page, search })

      // Build query string
      const params = new URLSearchParams()

      // Pagination
      params.set('page', page.toString())
      params.set('pageSize', pageSize.toString())

      // Search
      if (search) {
        params.set('search', search)
      }

      // Filters
      if (appliedFilters.dateRange) {
        params.set('startDate', appliedFilters.dateRange.startDate)
        params.set('endDate', appliedFilters.dateRange.endDate)
      }

      if (appliedFilters.location) {
        params.set('location', appliedFilters.location)
      }

      if (appliedFilters.industry) {
        params.set('industry', appliedFilters.industry)
      }

      if (appliedFilters.businessSize) {
        params.set('businessSize', appliedFilters.businessSize)
      }

      if (appliedFilters.languages && appliedFilters.languages.length > 0) {
        params.set('languages', appliedFilters.languages.join(','))
      }

      const queryString = params.toString()
      const url = `/api/admin/analytics/users?${queryString}`

      console.log('[AdminUsersPage] Fetching from URL:', url)

      const response = await fetch(url)

      console.log('[AdminUsersPage] Response status:', response.status)

      if (!response.ok) {
        let errorMessage = 'Failed to fetch user data'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
          console.error('[AdminUsersPage] Error response:', errorData)
        } catch (e) {
          console.error('[AdminUsersPage] Could not parse error response')
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('[AdminUsersPage] Success response:', result)

      if (result.success && result.data) {
        setUsers(result.data)
        setTotalPages(result.pagination?.totalPages || 1)
        setTotalCount(result.pagination?.totalCount || 0)
        setCurrentPage(result.pagination?.currentPage || page)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('[AdminUsersPage] Error fetching user attributes:', err)
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to load user data. Please try again.'
      )
      // Set empty data on error
      setUsers([])
      setTotalPages(1)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle filter changes
   */
  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page
    fetchUsers(newFilters, 1, searchQuery)
  }

  /**
   * Handle search
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page
    fetchUsers(filters, 1, query)
  }

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchUsers(filters, page, searchQuery)
  }

  /**
   * Initial data load
   */
  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      if (mounted) {
        await fetchUsers()
      }
    }
    
    loadData()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">User Attributes</h1>
              <p className="text-sm text-muted-foreground mt-1">
                View extracted user attributes from conversations
              </p>
            </div>
            {process.env.NODE_ENV === 'development' && loading && (
              <Button
                onClick={() => setLoading(false)}
                variant="outline"
                size="sm"
              >
                Force Stop Loading
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="border-b bg-muted/30">
        <div className="px-6 py-4">
          <FilterPanel 
            onFiltersChange={handleFiltersChange}
            loading={loading}
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-6 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content - Full Width */}
      <div className="flex-1 px-6 py-6 space-y-4">
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
            Loading: {loading ? 'true' : 'false'} | Users: {users.length} | Error: {error || 'none'}
          </div>
        )}

        {/* Search Bar and Results Count */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
          {!loading && (
            <div className="text-sm text-muted-foreground">
              Showing {users.length} of {totalCount} users
            </div>
          )}
        </div>

        {/* User Attributes Table */}
        <UserAttributesTable
          users={users}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}
