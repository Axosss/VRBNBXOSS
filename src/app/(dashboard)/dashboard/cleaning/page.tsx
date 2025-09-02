'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Filter,
  List
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { CleaningCalendar } from '@/components/cleaning/cleaning-calendar'
import { CleaningCard } from '@/components/cleaning/cleaning-card'
import { CleaningForm } from '@/components/cleaning/cleaning-form'
import { useCleaningStore } from '@/lib/stores/cleaning-store'
import { useApartmentStore } from '@/lib/stores/apartment-store'
import { cn } from '@/lib/utils'
import type { Cleaning, CleaningStatus, CreateCleaningData } from '@/types/cleaning'

type ViewMode = 'calendar' | 'list'

export default function CleaningSchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    cleanings,
    cleaners,
    cleaningFilters,
    isLoading,
    error,
    fetchCleanings,
    fetchCleaners,
    createCleaning,
    updateCleaning,
    setCleaningFilters,
    clearError
  } = useCleaningStore()
  
  const { apartments, fetchApartments } = useApartmentStore()

  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // URL params for filtering
  const apartmentParam = searchParams.get('apartment')
  const cleanerParam = searchParams.get('cleaner')
  const statusParam = searchParams.get('status')

  useEffect(() => {
    fetchCleanings()
    fetchCleaners()
    fetchApartments()
  }, [fetchCleanings, fetchCleaners, fetchApartments])

  // Apply URL filters
  useEffect(() => {
    const filters = {
      apartment_id: apartmentParam || undefined,
      cleaner_id: cleanerParam || undefined,
      status: (statusParam as CleaningStatus) || undefined
    }
    setCleaningFilters(filters)
    fetchCleanings(filters)
  }, [apartmentParam, cleanerParam, statusParam, fetchCleanings, setCleaningFilters])

  const handleCleaningClick = (cleaning: Cleaning) => {
    router.push(`/dashboard/cleaning/${cleaning.id}`)
  }

  const handleCreateCleaning = async (data: CreateCleaningData) => {
    try {
      await createCleaning(data)
      setShowCreateDialog(false)
      setSelectedDate(null)
    } catch (error: any) {
      console.error('Failed to create cleaning:', error)
      // Simple error message - cleanings are informational
      alert(`Failed to create cleaning: ${error.message || 'Unknown error'}`)
    }
  }

  const handleStatusChange = async (id: string, status: CleaningStatus) => {
    try {
      await updateCleaning(id, { status })
    } catch (error) {
      console.error('Failed to update cleaning status:', error)
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowCreateDialog(true)
  }

  const updateUrlFilters = (filters: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    router.replace(`/dashboard/cleaning?${params.toString()}`)
  }

  const handleApartmentFilter = (apartmentId: string | null) => {
    updateUrlFilters({ apartment: apartmentId })
  }

  const handleCleanerFilter = (cleanerId: string | null) => {
    updateUrlFilters({ cleaner: cleanerId })
  }

  const handleStatusFilter = (status: CleaningStatus | null) => {
    updateUrlFilters({ status })
  }

  const clearFilters = () => {
    router.replace('/dashboard/cleaning')
  }

  // Calculate simple stats
  const stats = {
    total: cleanings.length,
    scheduled: cleanings.filter(c => c.status === 'scheduled').length,
    completed: cleanings.filter(c => c.status === 'completed').length
  }

  const upcomingCleanings = cleanings
    .filter(c => c.status === 'scheduled')
    .filter(c => c.scheduledStart && c.scheduledEnd) // Filter out cleanings with invalid dates
    .sort((a, b) => {
      const dateA = new Date(a.scheduledStart)
      const dateB = new Date(b.scheduledStart)
      // Check for valid dates before comparing
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0
      }
      return dateA.getTime() - dateB.getTime()
    })
    .slice(0, 5)

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Cleaning Schedule</h1>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              clearError()
              fetchCleanings()
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
          <h1 className="text-2xl font-bold">Cleaning Schedule</h1>
          <p className="text-muted-foreground">
            Manage cleaning schedules and assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Cleaning
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule New Cleaning</DialogTitle>
              </DialogHeader>
              <CleaningForm
                mode="create"
                initialData={selectedDate ? {
                  scheduled_start: selectedDate.toISOString().slice(0, 16),
                  apartment_id: apartmentParam || '',
                  cleaner_id: cleanerParam || null
                } : {}}
                onSubmit={handleCreateCleaning}
                onCancel={() => {
                  setShowCreateDialog(false)
                  setSelectedDate(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Simple Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="rounded-r-none"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  (apartmentParam || cleanerParam || statusParam) && 
                  "border-primary bg-primary/5"
                )}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(apartmentParam || cleanerParam || statusParam) && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {[apartmentParam, cleanerParam, statusParam].filter(Boolean).length}
                  </Badge>
                )}
              </Button>

              {(apartmentParam || cleanerParam || statusParam) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              {apartments.length > 0 && (
                <select
                  value={apartmentParam || 'all'}
                  onChange={(e) => handleApartmentFilter(e.target.value === 'all' ? null : e.target.value)}
                  className="px-3 py-1 text-sm border rounded"
                >
                  <option value="all">All Properties</option>
                  {apartments.map((apartment) => (
                    <option key={apartment.id} value={apartment.id}>
                      {apartment.name}
                    </option>
                  ))}
                </select>
              )}

              {cleaners.length > 0 && (
                <select
                  value={cleanerParam || 'all'}
                  onChange={(e) => handleCleanerFilter(e.target.value === 'all' ? null : e.target.value)}
                  className="px-3 py-1 text-sm border rounded"
                >
                  <option value="all">All Cleaners</option>
                  {cleaners.map((cleaner) => (
                    <option key={cleaner.id} value={cleaner.id}>
                      {cleaner.name}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={statusParam || 'all'}
                onChange={(e) => handleStatusFilter(e.target.value === 'all' ? null : e.target.value as CleaningStatus)}
                className="px-3 py-1 text-sm border rounded"
              >
                <option value="all">All Status</option>
                <option value="needed">Needed</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : viewMode === 'calendar' ? (
        <CleaningCalendar
          cleanings={cleanings}
          onCleaningClick={handleCleaningClick}
          onDateClick={handleDateClick}
          onCreateCleaning={handleDateClick}
          selectedApartmentId={apartmentParam}
          selectedCleanerId={cleanerParam}
          selectedStatus={statusParam as CleaningStatus}
          onApartmentFilter={handleApartmentFilter}
          onCleanerFilter={handleCleanerFilter}
          onStatusFilter={handleStatusFilter}
          apartments={apartments.map(a => ({ id: a.id, name: a.name }))}
          cleaners={cleaners.map(c => ({ id: c.id, name: c.name }))}
        />
      ) : (
        <div className="space-y-6">
          {cleanings.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-12 w-12 text-muted-foreground" />}
              title="No cleanings scheduled"
              description="Get started by scheduling your first cleaning."
              action={
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Cleaning
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {cleanings.map(cleaning => (
                <CleaningCard
                  key={cleaning.id}
                  cleaning={cleaning}
                  onEdit={(cleaning) => router.push(`/dashboard/cleaning/${cleaning.id}`)}
                  onStatusChange={handleStatusChange}
                  onClick={handleCleaningClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Cleanings Sidebar (for larger screens) */}
      {viewMode === 'calendar' && upcomingCleanings.length > 0 && (
        <Card className="lg:max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Cleanings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingCleanings.map(cleaning => (
              <CleaningCard
                key={cleaning.id}
                cleaning={cleaning}
                onClick={handleCleaningClick}
                compact={true}
                showActions={false}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}