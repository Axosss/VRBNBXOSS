'use client'

import { useState, useEffect } from 'react'
import { CalendarView, QuickReservation } from '@/types/calendar'
import { useCalendar, useCalendarNavigation } from '@/lib/hooks/use-calendar'
import { CalendarNavigation } from '@/components/calendar/calendar-navigation'
import { CalendarViewComponent } from '@/components/calendar/calendar-view'
import { CalendarFilters } from '@/components/calendar/calendar-filters'
import { CalendarStats } from '@/components/calendar/calendar-stats'
import { QuickAddModal } from '@/components/calendar/quick-add-modal'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, CalendarIcon } from 'lucide-react'

export default function CalendarPage() {
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedApartment, setSelectedApartment] = useState<string | null>(null)

  // Calendar navigation state
  const {
    currentDate,
    view,
    selectedApartments,
    setView,
    setSelectedApartments,
    navigateDate,
    goToToday
  } = useCalendarNavigation()

  // Calculate date range based on current view
  const getDateRange = (dateToUse: Date = currentDate) => {
    const start = new Date(dateToUse)

    switch (view) {
      case 'day':
        // Single day - same start and end date
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: start.toISOString().split('T')[0]
        }
      case 'week':
        // Start of week to end of week
        const startOfWeek = new Date(start)
        startOfWeek.setDate(start.getDate() - start.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        return {
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: endOfWeek.toISOString().split('T')[0]
        }
      case 'month':
      default:
        // First day of month to last day of month with padding
        const monthStart = new Date(start.getFullYear(), start.getMonth(), 1)
        const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0)
        
        // Add padding to show complete weeks
        const calendarStart = new Date(monthStart)
        calendarStart.setDate(monthStart.getDate() - monthStart.getDay())
        
        const calendarEnd = new Date(monthEnd)
        const daysToAdd = 6 - monthEnd.getDay()
        calendarEnd.setDate(monthEnd.getDate() + daysToAdd)
        
        return {
          startDate: calendarStart.toISOString().split('T')[0],
          endDate: calendarEnd.toISOString().split('T')[0]
        }
    }
  }

  const { startDate, endDate } = getDateRange()

  // Calendar data hook with filters
  const {
    data,
    loading,
    error,
    filters,
    setFilters,
    refreshData,
    createQuickReservation
  } = useCalendar({
    initialFilters: {
      startDate,
      endDate,
      view,
      apartmentIds: selectedApartments.length > 0 ? selectedApartments : undefined,
      includeCleanings: true
    },
    includeStats: true,
    enableRealtime: true
  })

  // Sync filters when currentDate or view changes  
  useEffect(() => {
    const newRange = getDateRange(currentDate)
    setFilters({
      startDate: newRange.startDate,
      endDate: newRange.endDate,
      view
      // Note: includeCleanings is preserved automatically by the setFilters merge logic
    })
  }, [currentDate, view]) // Removed filters.includeCleanings to avoid circular dependency

  const handleViewChange = (newView: CalendarView) => {
    setView(newView)
    const newRange = getDateRange()
    setFilters({
      view: newView,
      startDate: newRange.startDate,
      endDate: newRange.endDate
    })
  }

  const handleDateNavigation = (direction: 'prev' | 'next') => {
    // Calculate the new date based on the direction
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    
    // Update navigation state
    navigateDate(direction)
    
    // Calculate new range with the new date
    const newRange = getDateRange(newDate)
    setFilters({
      startDate: newRange.startDate,
      endDate: newRange.endDate
    })
  }

  const handleTodayClick = () => {
    const today = new Date()
    goToToday()
    const newRange = getDateRange(today)
    setFilters({
      startDate: newRange.startDate,
      endDate: newRange.endDate
    })
  }

  const handleApartmentFilter = (apartmentIds: string[]) => {
    setSelectedApartments(apartmentIds)
    setFilters({
      apartmentIds: apartmentIds.length > 0 ? apartmentIds : undefined
    })
  }

  const handleDateClick = (date: Date, apartmentId?: string) => {
    setSelectedDate(date)
    setSelectedApartment(apartmentId || null)
    setShowQuickAdd(true)
  }

  const handleQuickAdd = async (reservationData: QuickReservation) => {
    try {
      await createQuickReservation(reservationData)
      setShowQuickAdd(false)
      setSelectedDate(null)
      setSelectedApartment(null)
    } catch (error) {
      console.error('Failed to create quick reservation:', error)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">
            Manage reservations and view occupancy across all properties
          </p>
        </div>
        <Button onClick={() => setShowQuickAdd(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Quick Add
        </Button>
      </div>

      {/* Filters */}
      <CalendarFilters
        apartments={data?.apartments || []}
        selectedApartments={selectedApartments}
        onApartmentChange={handleApartmentFilter}
        includeCleanings={filters.includeCleanings || false}
        onIncludeCleaningsChange={(includeCleanings) => 
          setFilters({ includeCleanings })
        }
      />

      {/* Stats Bar */}
      {data?.stats && (
        <CalendarStats 
          stats={data.stats}
          dateRange={{ start: startDate, end: endDate }}
        />
      )}

      {/* Calendar Navigation */}
      <Card className="p-6">
        <CalendarNavigation
          currentDate={currentDate}
          view={view}
          onViewChange={handleViewChange}
          onNavigate={handleDateNavigation}
          onTodayClick={handleTodayClick}
        />

        {/* Calendar Content */}
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <EmptyState
                icon={<CalendarIcon className="h-12 w-12 text-muted-foreground" />}
                title="Error loading calendar"
                description={error}
                action={
                  <Button onClick={refreshData}>
                    Try again
                  </Button>
                }
              />
            </div>
          ) : !data || data.reservations.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <EmptyState
                icon={<CalendarIcon className="h-12 w-12 text-muted-foreground" />}
                title="No reservations found"
                description="Get started by adding your first reservation"
                action={
                  <Button onClick={() => setShowQuickAdd(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reservation
                  </Button>
                }
              />
            </div>
          ) : (
            <CalendarViewComponent
              data={data}
              view={view}
              currentDate={currentDate}
              onDateClick={handleDateClick}
              onNavigate={handleDateNavigation}
            />
          )}
        </div>
      </Card>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => {
          setShowQuickAdd(false)
          setSelectedDate(null)
          setSelectedApartment(null)
        }}
        onSubmit={handleQuickAdd}
        apartments={data?.apartments || []}
        selectedDate={selectedDate}
        selectedApartment={selectedApartment}
      />
    </div>
  )
}