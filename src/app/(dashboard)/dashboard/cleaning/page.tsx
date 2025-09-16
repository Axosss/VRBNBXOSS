'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  XCircle,
  Filter,
  List,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  Edit,
  Trash2
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
import { CleaningMonthView } from '@/components/cleaning/cleaning-month-view'
import { CleaningCard } from '@/components/cleaning/cleaning-card'
import { CleaningForm } from '@/components/cleaning/cleaning-form'
import { CleanerCard } from '@/components/cleaning/cleaner-card'
import { useCleaningStore } from '@/lib/stores/cleaning-store'
import { useApartmentStore } from '@/lib/stores/apartment-store'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Cleaning, CleaningStatus, CreateCleaningData } from '@/types/cleaning'

type ViewMode = 'calendar' | 'list'

interface NavigationState {
  currentDate: Date
}

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
    deleteCleaning,
    setCleaningFilters,
    clearError
  } = useCleaningStore()
  
  const { apartments, fetchApartments } = useApartmentStore()

  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [navigation, setNavigation] = useState<NavigationState>({
    currentDate: new Date()
  })
  const [cleanerSearchQuery, setCleanerSearchQuery] = useState('')

  // URL params for filtering
  const apartmentParam = searchParams.get('apartment')
  const cleanerParam = searchParams.get('cleaner')

  useEffect(() => {
    fetchCleanings()
    fetchCleaners()
    fetchApartments()
  }, [fetchCleanings, fetchCleaners, fetchApartments])

  // Apply URL filters
  useEffect(() => {
    const filters = {
      apartment_id: apartmentParam || undefined,
      cleaner_id: cleanerParam || undefined
    }
    setCleaningFilters(filters)
    fetchCleanings(filters)
  }, [apartmentParam, cleanerParam, fetchCleanings, setCleaningFilters])

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
  
  const handleDeleteCleaning = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this cleaning?')) {
      try {
        await deleteCleaning(id)
        await fetchCleanings() // Refresh the list
      } catch (error) {
        console.error('Failed to delete cleaning:', error)
        alert('Failed to delete cleaning: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
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

  const clearFilters = () => {
    router.replace('/dashboard/cleaning')
  }

  // Calculate simple stats
  const now = new Date()
  const futureCleanings = cleanings.filter(c => {
    if (c.status === 'cancelled') return false
    const cleaningDate = new Date(c.scheduledStart)
    return !isNaN(cleaningDate.getTime()) && cleaningDate > now
  })
  
  const stats = {
    total: cleanings.length,
    future: futureCleanings.length,
    cancelled: cleanings.filter(c => c.status === 'cancelled').length
  }

  const upcomingCleanings = cleanings
    .filter(c => c.status !== 'cancelled')
    .filter(c => c.scheduledStart && c.scheduledEnd) // Filter out cleanings with invalid dates
    .filter(c => {
      // Only show future cleanings in upcoming section
      const cleaningDate = new Date(c.scheduledStart)
      return !isNaN(cleaningDate.getTime()) && cleaningDate >= now
    })
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

      {/* Stats Line */}
      <Card>
        <CardContent className="py-2 px-4">
          <div className="flex items-center justify-around">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="text-lg font-bold">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Future:</span>
              <span className="text-lg font-bold">{stats.future}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Cleanings */}
      {upcomingCleanings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Cleanings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingCleanings.map(cleaning => (
                <CleaningCard
                  key={cleaning.id}
                  cleaning={cleaning}
                  onClick={handleCleaningClick}
                  onDelete={handleDeleteCleaning}
                  onStatusChange={handleStatusChange}
                  compact={false}
                  showActions={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : viewMode === 'calendar' ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Navigation and View Toggle */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(navigation.currentDate)
                      newDate.setMonth(newDate.getMonth() - 1)
                      setNavigation({ currentDate: newDate })
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNavigation({ currentDate: new Date() })}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(navigation.currentDate)
                      newDate.setMonth(newDate.getMonth() + 1)
                      setNavigation({ currentDate: newDate })
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-lg font-semibold">
                  {navigation.currentDate.toLocaleDateString([], { year: 'numeric', month: 'long' })}
                </div>
              </div>

              {/* View Mode and Filters */}
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    (apartmentParam || cleanerParam) &&
                    "border-primary bg-primary/5"
                  )}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {(apartmentParam || cleanerParam) && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                      {[apartmentParam, cleanerParam].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>

                {(apartmentParam || cleanerParam) && (
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
              </div>
            )}
          </CardHeader>

          <CardContent className="p-4">
            {/* Calendar View */}
            <CleaningMonthView
              cleanings={cleanings}
              currentDate={navigation.currentDate}
              onDateClick={handleDateClick}
              onCleaningClick={handleCleaningClick}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cleaning List</CardTitle>
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    (apartmentParam || cleanerParam) &&
                    "border-primary bg-primary/5"
                  )}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {(apartmentParam || cleanerParam) && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                      {[apartmentParam, cleanerParam].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
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
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4">
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
                  onDelete={handleDeleteCleaning}
                  onStatusChange={handleStatusChange}
                  onClick={handleCleaningClick}
                />
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      )}


      {/* Cleaners Section - Separator */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-4 text-muted-foreground">Cleaners Management</span>
        </div>
      </div>

      {/* Cleaners Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cleaners
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your cleaning staff
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/cleaners/new')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Cleaner
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search cleaners..."
            value={cleanerSearchQuery}
            onChange={(e) => setCleanerSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Cleaners List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cleaners
            .filter(cleaner => {
              if (!cleanerSearchQuery) return true
              const query = cleanerSearchQuery.toLowerCase()
              return (
                cleaner.name.toLowerCase().includes(query) ||
                cleaner.email?.toLowerCase().includes(query) ||
                cleaner.phone?.toLowerCase().includes(query)
              )
            })
            .map(cleaner => (
              <Card key={cleaner.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{cleaner.name}</h3>
                        {cleaner.email && (
                          <p className="text-sm text-muted-foreground truncate">
                            {cleaner.email}
                          </p>
                        )}
                        {cleaner.phone && (
                          <p className="text-sm text-muted-foreground">
                            {cleaner.phone}
                          </p>
                        )}
                      </div>
                      <Badge variant={cleaner.active ? 'default' : 'secondary'}>
                        {cleaner.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        {cleaner.cleanings?.length || 0} cleanings
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/cleaners/${cleaner.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this cleaner?')) {
                              deleteCleaner(cleaner.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {cleaners.length === 0 && (
          <EmptyState
            icon={<Users className="h-12 w-12 text-muted-foreground" />}
            title="No cleaners yet"
            description="Add your first cleaner to start managing your cleaning staff."
            action={
              <Button onClick={() => router.push('/dashboard/cleaners/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Cleaner
              </Button>
            }
          />
        )}
      </div>
    </div>
  )
}