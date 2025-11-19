'use client'

/**
 * Filter Panel Component
 * 
 * Provides filtering controls for analytics dashboard:
 * - Date range picker (start date, end date)
 * - Location dropdown filter
 * - Industry dropdown filter
 * - Scheme dropdown filter
 * - Apply and Clear Filters buttons
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * @module components/admin/FilterPanel
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Filter, X } from 'lucide-react'
import type { AnalyticsFilters } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

export interface FilterPanelProps {
  onFiltersChange: (filters: AnalyticsFilters) => void
  loading?: boolean
}

interface FilterOptions {
  locations: string[]
  industries: string[]
  schemes: Array<{ id: string; name: string }>
}

// ============================================================================
// Component
// ============================================================================

export function FilterPanel({ onFiltersChange, loading = false }: FilterPanelProps) {
  // Filter state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [location, setLocation] = useState('all')
  const [industry, setIndustry] = useState('all')
  const [schemeId, setSchemeId] = useState('all')
  const [businessSize, setBusinessSize] = useState<'Micro' | 'Small' | 'Medium' | 'all' | ''>('all')

  // Filter options state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    locations: [],
    industries: [],
    schemes: []
  })
  const [loadingOptions, setLoadingOptions] = useState(true)

  /**
   * Fetch filter options from API
   */
  useEffect(() => {
    let mounted = true

    const fetchFilterOptions = async () => {
      try {
        setLoadingOptions(true)

        console.log('[FilterPanel] Fetching filter options...')

        // Fetch locations, industries, and schemes
        // For now, we'll fetch from the summary endpoint without filters
        const response = await fetch('/api/admin/analytics/summary')
        
        if (!response.ok) {
          console.error('[FilterPanel] Failed to fetch summary:', response.status)
          throw new Error('Failed to fetch filter options')
        }

        const result = await response.json()
        console.log('[FilterPanel] Summary result:', result)
        
        if (mounted && result.success && result.data) {
          const { locationDistribution, industryDistribution } = result.data

          // Extract unique locations and industries
          const locations = (locationDistribution || [])
            .map((item: any) => item.location)
            .filter((loc: string) => loc && loc !== 'Unknown')
          
          const industries = (industryDistribution || [])
            .map((item: any) => item.industry)
            .filter((ind: string) => ind && ind !== 'Unknown')

          // Fetch schemes
          const schemesResponse = await fetch('/api/admin/analytics/schemes?pageSize=100')
          let schemes: Array<{ id: string; name: string }> = []
          
          if (schemesResponse.ok) {
            const schemesResult = await schemesResponse.json()
            if (schemesResult.success && schemesResult.data) {
              // Extract unique schemes from the interests data
              const schemeMap = new Map<string, string>()
              schemesResult.data.forEach((interest: any) => {
                if (interest.scheme_id && interest.scheme_name) {
                  schemeMap.set(interest.scheme_id, interest.scheme_name)
                }
              })
              schemes = Array.from(schemeMap.entries()).map(([id, name]) => ({ id, name }))
            }
          }

          if (mounted) {
            setFilterOptions({
              locations,
              industries,
              schemes
            })
          }
        }
      } catch (error) {
        console.error('[FilterPanel] Error fetching filter options:', error)
        // Set empty options on error so the component still renders
        if (mounted) {
          setFilterOptions({
            locations: [],
            industries: [],
            schemes: []
          })
        }
      } finally {
        if (mounted) {
          setLoadingOptions(false)
        }
      }
    }

    fetchFilterOptions()

    return () => {
      mounted = false
    }
  }, [])

  /**
   * Handle apply filters
   */
  const handleApplyFilters = () => {
    const filters: AnalyticsFilters = {}

    // Date range
    if (startDate && endDate) {
      filters.dateRange = { startDate, endDate }
    }

    // Location (skip if "all")
    if (location && location !== 'all') {
      filters.location = location
    }

    // Industry (skip if "all")
    if (industry && industry !== 'all') {
      filters.industry = industry
    }

    // Scheme (skip if "all")
    if (schemeId && schemeId !== 'all') {
      filters.schemeId = schemeId
    }

    // Business size (skip if "all")
    if (businessSize && businessSize !== 'all') {
      filters.businessSize = businessSize
    }

    onFiltersChange(filters)
  }

  /**
   * Handle clear filters
   */
  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setLocation('all')
    setIndustry('all')
    setSchemeId('all')
    setBusinessSize('all')
    onFiltersChange({})
  }

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = () => {
    return !!(startDate || endDate || location || industry || schemeId || businessSize)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Date Range */}
      <div className="flex gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="startDate" className="text-xs">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={loading}
            className="h-9 w-[140px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate" className="text-xs">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={loading}
            className="h-9 w-[140px]"
          />
        </div>
      </div>

      {/* Location Filter */}
      <div className="space-y-1.5">
        <Label htmlFor="location" className="text-xs">Location</Label>
        <Select
          value={location}
          onValueChange={setLocation}
          disabled={loading || loadingOptions}
        >
          <SelectTrigger id="location" className="h-9 w-[160px]">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {filterOptions.locations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Industry Filter */}
      <div className="space-y-1.5">
        <Label htmlFor="industry" className="text-xs">Industry</Label>
        <Select
          value={industry}
          onValueChange={setIndustry}
          disabled={loading || loadingOptions}
        >
          <SelectTrigger id="industry" className="h-9 w-[160px]">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {filterOptions.industries.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scheme Filter */}
      <div className="space-y-1.5">
        <Label htmlFor="scheme" className="text-xs">Scheme</Label>
        <Select
          value={schemeId}
          onValueChange={setSchemeId}
          disabled={loading || loadingOptions}
        >
          <SelectTrigger id="scheme" className="h-9 w-[180px]">
            <SelectValue placeholder="All Schemes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schemes</SelectItem>
            {filterOptions.schemes.map((scheme) => (
              <SelectItem key={scheme.id} value={scheme.id}>
                {scheme.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Business Size Filter */}
      <div className="space-y-1.5">
        <Label htmlFor="businessSize" className="text-xs">Business Size</Label>
        <Select
          value={businessSize}
          onValueChange={(value) => setBusinessSize(value as any)}
          disabled={loading}
        >
          <SelectTrigger id="businessSize" className="h-9 w-[140px]">
            <SelectValue placeholder="All Sizes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sizes</SelectItem>
            <SelectItem value="Micro">Micro</SelectItem>
            <SelectItem value="Small">Small</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 ml-auto">
        <Button
          onClick={handleApplyFilters}
          disabled={loading}
          size="sm"
          className="h-9"
        >
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          Apply
        </Button>
        <Button
          onClick={handleClearFilters}
          variant="outline"
          size="sm"
          disabled={loading || !hasActiveFilters()}
          className="h-9"
        >
          <X className="h-3.5 w-3.5 mr-1.5" />
          Clear
        </Button>
      </div>
    </div>
  )
}
