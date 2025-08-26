'use client'

import { useState, useMemo } from 'react'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Plus,
  Clock,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CleaningStatusBadge } from './cleaning-status-badge'
import { cn } from '@/lib/utils'
import type { Cleaning, CleaningStatus } from '@/types/cleaning'

interface CleaningCalendarProps {
  cleanings: Cleaning[]
  onCleaningClick?: (cleaning: Cleaning) => void
  onDateClick?: (date: Date) => void
  onCreateCleaning?: (date: Date) => void
  selectedApartmentId?: string
  selectedCleanerId?: string
  selectedStatus?: CleaningStatus
  onApartmentFilter?: (apartmentId: string | null) => void
  onCleanerFilter?: (cleanerId: string | null) => void
  onStatusFilter?: (status: CleaningStatus | null) => void
  apartments?: Array<{ id: string; name: string }>
  cleaners?: Array<{ id: string; name: string }>
}

type ViewMode = 'month' | 'week' | 'day'

export function CleaningCalendar({
  cleanings,
  onCleaningClick,
  onDateClick,
  onCreateCleaning,
  selectedApartmentId,
  selectedCleanerId,
  selectedStatus,
  onApartmentFilter,
  onCleanerFilter,
  onStatusFilter,
  apartments = [],
  cleaners = []
}: CleaningCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('week')

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return formatDate(date1) === formatDate(date2)
  }

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Start on Monday
    startOfWeek.setDate(diff)

    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek)
      weekDate.setDate(startOfWeek.getDate() + i)
      weekDates.push(weekDate)
    }
    return weekDates
  }

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // Get first day of month and find the Monday of the week it's in
    const firstDayOfMonth = new Date(year, month, 1)
    const startDate = new Date(firstDayOfMonth)
    const firstWeekday = firstDayOfMonth.getDay()
    const daysFromMonday = firstWeekday === 0 ? 6 : firstWeekday - 1
    startDate.setDate(firstDayOfMonth.getDate() - daysFromMonday)

    // Generate 42 days (6 weeks) to cover full month view
    const monthDates = []
    for (let i = 0; i < 42; i++) {
      const monthDate = new Date(startDate)
      monthDate.setDate(startDate.getDate() + i)
      monthDates.push(monthDate)
    }
    return monthDates
  }

  const getDayHours = () => {
    const hours = []
    for (let i = 6; i <= 22; i++) {
      hours.push(i)
    }
    return hours
  }

  const filteredCleanings = useMemo(() => {
    return cleanings.filter(cleaning => {
      if (selectedApartmentId && cleaning.apartment_id !== selectedApartmentId) return false
      if (selectedCleanerId && cleaning.cleaner_id !== selectedCleanerId) return false
      if (selectedStatus && cleaning.status !== selectedStatus) return false
      return true
    })
  }, [cleanings, selectedApartmentId, selectedCleanerId, selectedStatus])

  const getCleaningsForDate = (date: Date) => {
    return filteredCleanings.filter(cleaning => 
      isSameDay(new Date(cleaning.scheduled_start), date)
    )
  }

  const getCleaningsForHour = (date: Date, hour: number) => {
    return filteredCleanings.filter(cleaning => {
      const cleaningDate = new Date(cleaning.scheduled_start)
      return isSameDay(cleaningDate, date) && cleaningDate.getHours() === hour
    })
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
    }
    
    setCurrentDate(newDate)
  }

  const getViewTitle = () => {
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString([], { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      case 'week':
        const weekDates = getWeekDates(currentDate)
        const startDate = weekDates[0]
        const endDate = weekDates[6]
        return `${startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
      case 'month':
        return currentDate.toLocaleDateString([], { year: 'numeric', month: 'long' })
    }
  }

  const renderCleaningItem = (cleaning: Cleaning, compact = false) => (
    <div
      key={cleaning.id}
      className={cn(
        "p-2 rounded text-xs cursor-pointer transition-colors hover:opacity-80 border-l-2",
        compact ? "mb-1" : "mb-2"
      )}
      style={{
        backgroundColor: getStatusColor(cleaning.status, 0.1),
        borderLeftColor: getStatusColor(cleaning.status, 1)
      }}
      onClick={() => onCleaningClick?.(cleaning)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium truncate">
          {cleaning.cleaning_type.charAt(0).toUpperCase() + cleaning.cleaning_type.slice(1)}
        </span>
        <CleaningStatusBadge status={cleaning.status} className="text-xs py-0 px-1" />
      </div>
      
      {!compact && (
        <>
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <Clock className="h-3 w-3" />
            <span>
              {formatTime(cleaning.scheduled_start)} - {formatTime(cleaning.scheduled_end)}
            </span>
          </div>
          
          {cleaning.apartment && (
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{cleaning.apartment.name}</span>
            </div>
          )}
          
          {cleaning.cleaner && (
            <div className="text-muted-foreground truncate">
              {cleaning.cleaner.name}
            </div>
          )}
        </>
      )}
    </div>
  )

  const getStatusColor = (status: CleaningStatus, opacity = 1) => {
    const colors = {
      needed: `rgba(249, 115, 22, ${opacity})`, // orange
      scheduled: `rgba(59, 130, 246, ${opacity})`, // blue
      in_progress: `rgba(245, 158, 11, ${opacity})`, // amber
      completed: `rgba(34, 197, 94, ${opacity})`, // green
      verified: `rgba(16, 185, 129, ${opacity})`, // emerald
      cancelled: `rgba(239, 68, 68, ${opacity})` // red
    }
    return colors[status] || colors.scheduled
  }

  const renderMonthView = () => {
    const monthDates = getMonthDates(currentDate)
    const currentMonth = currentDate.getMonth()

    return (
      <div className="grid grid-cols-7 gap-px bg-muted">
        {/* Header */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="bg-background p-2 text-center text-sm font-medium">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {monthDates.map((date, index) => {
          const dayCleanings = getCleaningsForDate(date)
          const isCurrentMonth = date.getMonth() === currentMonth
          const isToday = isSameDay(date, new Date())
          
          return (
            <div
              key={index}
              className={cn(
                "bg-background p-2 min-h-[120px] cursor-pointer hover:bg-muted/50 transition-colors",
                !isCurrentMonth && "text-muted-foreground bg-muted/30"
              )}
              onClick={() => {
                onDateClick?.(date)
                if (onCreateCleaning) {
                  onCreateCleaning(date)
                }
              }}
            >
              <div className={cn(
                "text-sm font-medium mb-2",
                isToday && "text-primary font-bold"
              )}>
                {date.getDate()}
              </div>
              
              <div className="space-y-1">
                {dayCleanings.slice(0, 3).map((cleaning) => 
                  renderCleaningItem(cleaning, true)
                )}
                
                {dayCleanings.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayCleanings.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate)
    const hours = getDayHours()

    return (
      <div className="grid grid-cols-8 gap-px bg-muted">
        {/* Time column header */}
        <div className="bg-background"></div>
        
        {/* Day headers */}
        {weekDates.map((date) => {
          const isToday = isSameDay(date, new Date())
          return (
            <div key={date.toISOString()} className="bg-background p-2 text-center">
              <div className={cn(
                "text-sm font-medium",
                isToday && "text-primary font-bold"
              )}>
                {date.toLocaleDateString([], { weekday: 'short' })}
              </div>
              <div className={cn(
                "text-lg font-bold",
                isToday && "text-primary"
              )}>
                {date.getDate()}
              </div>
            </div>
          )
        })}
        
        {/* Time slots */}
        {hours.map((hour) => (
          <React.Fragment key={hour}>
            {/* Time label */}
            <div className="bg-background p-2 text-right text-xs text-muted-foreground border-r">
              {hour}:00
            </div>
            
            {/* Day columns */}
            {weekDates.map((date) => {
              const hourCleanings = getCleaningsForHour(date, hour)
              
              return (
                <div
                  key={`${date.toISOString()}-${hour}`}
                  className="bg-background p-1 min-h-[60px] cursor-pointer hover:bg-muted/50 transition-colors border-r"
                  onClick={() => {
                    const clickDate = new Date(date)
                    clickDate.setHours(hour, 0, 0, 0)
                    onDateClick?.(clickDate)
                    if (onCreateCleaning) {
                      onCreateCleaning(clickDate)
                    }
                  }}
                >
                  {hourCleanings.map((cleaning) => renderCleaningItem(cleaning))}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    )
  }

  const renderDayView = () => {
    const hours = getDayHours()
    const dayCleanings = getCleaningsForDate(currentDate)

    return (
      <div className="space-y-4">
        {/* Day header */}
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="text-sm text-muted-foreground">
            {currentDate.toLocaleDateString([], { weekday: 'long' })}
          </div>
          <div className="text-2xl font-bold">
            {currentDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          {dayCleanings.length > 0 && (
            <div className="text-sm text-muted-foreground mt-1">
              {dayCleanings.length} cleaning{dayCleanings.length !== 1 ? 's' : ''} scheduled
            </div>
          )}
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          {hours.map((hour) => {
            const hourCleanings = getCleaningsForHour(currentDate, hour)
            
            return (
              <div key={hour} className="flex gap-4">
                <div className="w-16 text-right text-sm text-muted-foreground pt-2">
                  {hour}:00
                </div>
                <div 
                  className="flex-1 min-h-[60px] p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    const clickDate = new Date(currentDate)
                    clickDate.setHours(hour, 0, 0, 0)
                    onDateClick?.(clickDate)
                    if (onCreateCleaning) {
                      onCreateCleaning(clickDate)
                    }
                  }}
                >
                  {hourCleanings.map((cleaning) => renderCleaningItem(cleaning))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cleaning Schedule
          </CardTitle>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {apartments.length > 0 && onApartmentFilter && (
              <Select
                value={selectedApartmentId || 'all'}
                onValueChange={(value) => onApartmentFilter(value === 'all' ? null : value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {apartments.map((apartment) => (
                    <SelectItem key={apartment.id} value={apartment.id}>
                      {apartment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {cleaners.length > 0 && onCleanerFilter && (
              <Select
                value={selectedCleanerId || 'all'}
                onValueChange={(value) => onCleanerFilter(value === 'all' ? null : value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cleaners</SelectItem>
                  {cleaners.map((cleaner) => (
                    <SelectItem key={cleaner.id} value={cleaner.id}>
                      {cleaner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {onStatusFilter && (
              <Select
                value={selectedStatus || 'all'}
                onValueChange={(value) => onStatusFilter(value === 'all' ? null : value as CleaningStatus)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="needed">Needed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Navigation */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-lg font-semibold">
            {getViewTitle()}
          </div>
          
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="rounded-r-none text-xs"
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="rounded-none text-xs"
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="rounded-l-none text-xs"
            >
              Month
            </Button>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="p-4">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>
      </CardContent>
    </Card>
  )
}

// React import for Fragment
import React from 'react'