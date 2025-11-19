'use client'

/**
 * Admin Schemes Page
 * 
 * Displays table of schemes with interest metrics:
 * - Scheme interests table with pagination
 * - Filters (same as dashboard)
 * - Search functionality
 * 
 * Requirements: 1.3, 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * @module app/admin/schemes/page
 */

import { useState, useEffect } from 'react'
import { FilterPanel } from '@/components/admin/FilterPanel'
import { SchemeInterestsTable } from '@/components/admin/SchemeInterestsTable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { AlertCircle, Search } from 'lucide-react'
import type { AnalyticsFilters, SchemeInterestWithDetails } from '@/types/database'

// ============================================================================
// Component
// ============================================================================

export default function AdminSchemesPage() {
  // State
  const [schemes, setSchemes] = useState<SchemeInterestWithDetails[]>([])
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
   * Fetch scheme interests
   */
  const fetchSchemes = async (
    appliedFilters: AnalyticsFilters = {},
    page: number = 1,
    search: string = ''
  ) => {
    try {
      setLoading(true)
      setError(null)

      // Build query string
      const params = new URLSearchParams()

      // Pagination
      params.set('page', page.toString())
      params.set('pageSize', pageSize.toString())

      // Search (filter by scheme name)
      if (search) {
        params.set('search', search)
      }

      // Filters
      if (appliedFilters.dateRange) {
        params.set('startDate', appliedFilters.dateRange.startDate)
        params.set('endDate', appliedFilters.dateRange.endDate)
      }

      if (appliedFilters.schemeId) {
        params.set('schemeId', appliedFilters.schemeId)
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
      const url = `/api/admin/analytics/schemes?${queryString}`

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch scheme data')
      }

      const result = await response.json()

      if (result.success && result.data) {
        setSchemes(result.data)
        setTotalPages(result.pagination?.totalPages || 1)
        setTotalCount(result.pagination?.totalCount || 0)
        setCurrentPage(result.pagination?.currentPage || 1)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching scheme interests:', err)
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to load scheme data. Please try again.'
      )
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
    fetchSchemes(newFilters, 1, searchQuery)
  }

  /**
   * Handle search
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page
    fetchSchemes(filters, 1, query)
  }

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchSchemes(filters, page, searchQuery)
  }

  /**
   * Initial data load
   */
  useEffect(() => {
    fetchSchemes()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold">Scheme Interests</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View scheme interest metrics and user engagement
            </p>
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
        {/* Search Bar and Results Count */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by scheme name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
          {!loading && (
            <div className="text-sm text-muted-foreground">
              Showing {schemes.length} of {totalCount} scheme interests
            </div>
          )}
        </div>

        {/* Scheme Interests Table */}
        <SchemeInterestsTable
          schemes={schemes}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}
