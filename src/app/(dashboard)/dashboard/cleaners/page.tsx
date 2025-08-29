'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Grid, List, Users, Star, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { CleanerCard } from '@/components/cleaning/cleaner-card'
import { useCleaningStore } from '@/lib/stores/cleaning-store'
import { cn } from '@/lib/utils'
import type { Cleaner, CleanerFilters } from '@/types/cleaning'

type ViewMode = 'grid' | 'list'

export default function CleanersPage() {
  const router = useRouter()
  const {
    cleaners,
    cleanerPagination,
    cleanerFilters,
    isLoading,
    error,
    fetchCleaners,
    updateCleaner,
    deleteCleaner,
    setCleanerFilters,
    clearError
  } = useCleaningStore()

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [localFilters, setLocalFilters] = useState<Partial<CleanerFilters>>({
    active: undefined,
    minRating: undefined
  })

  // Load cleaners on mount
  useEffect(() => {
    fetchCleaners()
  }, [fetchCleaners])

  // Apply filters when they change
  useEffect(() => {
    const filters: CleanerFilters = {
      search: searchQuery || undefined,
      ...localFilters
    }
    setCleanerFilters(filters)
    fetchCleaners(filters)
  }, [searchQuery, localFilters, setCleanerFilters, fetchCleaners])

  const handleEdit = (cleaner: Cleaner) => {
    router.push(`/dashboard/cleaners/${cleaner.id}/edit`)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this cleaner?')) {
      try {
        await deleteCleaner(id)
      } catch (error) {
        console.error('Failed to delete cleaner:', error)
      }
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await updateCleaner(id, { active })
    } catch (error) {
      console.error('Failed to update cleaner status:', error)
    }
  }

  const handleViewCleaner = (cleaner: Cleaner) => {
    router.push(`/dashboard/cleaners/${cleaner.id}`)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setLocalFilters({})
  }

  const activeFilterCount = Object.values({
    search: searchQuery,
    ...localFilters
  }).filter(value => value !== undefined && value !== '').length

  // Calculate stats
  const stats = {
    total: cleaners.length,
    active: cleaners.filter(c => c.active).length,
    averageRating: cleaners.length > 0 
      ? cleaners.reduce((sum, c) => sum + (c.rating || 0), 0) / cleaners.filter(c => c.rating).length
      : 0,
    withSupplies: cleaners.filter(c => c.supplies_included).length
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Cleaners</h1>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              clearError()
              fetchCleaners()
            }}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cleaners</h1>
          <p className="text-muted-foreground">
            Manage your cleaning team and assignments
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/cleaners/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Cleaner
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cleaners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on completed jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supply Providers</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withSupplies}</div>
            <p className="text-xs text-muted-foreground">
              Include cleaning supplies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for assignments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cleaners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={localFilters.active === undefined ? 'all' : (localFilters.active ? 'active' : 'inactive')}
                onValueChange={(value) => 
                  setLocalFilters(prev => ({
                    ...prev,
                    active: value === 'all' ? undefined : value === 'active'
                  }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={localFilters.minRating?.toString() || 'all'}
                onValueChange={(value) => 
                  setLocalFilters(prev => ({
                    ...prev,
                    minRating: value === 'all' ? undefined : parseInt(value)
                  }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="2">2+ Stars</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>
                    Clear All Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* View Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : cleaners.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12 text-muted-foreground" />}
          title="No cleaners found"
          description={
            activeFilterCount > 0 
              ? "No cleaners match your current filters. Try adjusting your search criteria."
              : "You haven't added any cleaners yet. Add your first cleaner to get started."
          }
          action={
            activeFilterCount > 0 ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => router.push('/dashboard/cleaners/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Cleaner
              </Button>
            )
          }
        />
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        )}>
          {cleaners.map(cleaner => (
            <CleanerCard
              key={cleaner.id}
              cleaner={cleaner}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onClick={handleViewCleaner}
              className={viewMode === 'list' ? 'max-w-none' : ''}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {cleanerPagination && cleanerPagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((cleanerPagination.page - 1) * cleanerPagination.limit) + 1} to{' '}
            {Math.min(cleanerPagination.page * cleanerPagination.limit, cleanerPagination.total)} of{' '}
            {cleanerPagination.total} cleaners
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCleaners({ ...cleanerFilters, page: cleanerPagination.page - 1 })}
              disabled={cleanerPagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCleaners({ ...cleanerFilters, page: cleanerPagination.page + 1 })}
              disabled={cleanerPagination.page >= cleanerPagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}