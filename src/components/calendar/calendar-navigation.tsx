'use client'

import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { CalendarView } from '@/types/calendar'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarNavigationProps {
  currentDate: Date
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onNavigate: (direction: 'prev' | 'next') => void
  onTodayClick: () => void
  className?: string
}

const viewLabels: Record<CalendarView, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month'
}

const getDateDisplayFormat = (date: Date, view: CalendarView): string => {
  switch (view) {
    case 'day':
      return format(date, 'EEEE, MMMM d, yyyy')
    case 'week':
      // Show week range
      const startOfWeek = new Date(date)
      startOfWeek.setDate(date.getDate() - date.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${format(startOfWeek, 'MMM d')} - ${format(endOfWeek, 'd, yyyy')}`
      } else {
        return `${format(startOfWeek, 'MMM d')} - ${format(endOfWeek, 'MMM d, yyyy')}`
      }
    case 'month':
    default:
      return format(date, 'MMMM yyyy')
  }
}

export function CalendarNavigation({
  currentDate,
  view,
  onViewChange,
  onNavigate,
  onTodayClick,
  className
}: CalendarNavigationProps) {
  const isToday = () => {
    const today = new Date()
    switch (view) {
      case 'day':
        return currentDate.toDateString() === today.toDateString()
      case 'week':
        const startOfWeek = new Date(currentDate)
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        return today >= startOfWeek && today <= endOfWeek
      case 'month':
        return currentDate.getMonth() === today.getMonth() && 
               currentDate.getFullYear() === today.getFullYear()
      default:
        return false
    }
  }

  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
      className
    )}>
      {/* Date Display and Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('prev')}
          aria-label="Previous period"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="min-w-0 flex-1 sm:flex-none">
          <h2 className="text-lg font-semibold text-foreground whitespace-nowrap">
            {getDateDisplayFormat(currentDate, view)}
          </h2>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('next')}
          aria-label="Next period"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onTodayClick}
          disabled={isToday()}
        >
          Today
        </Button>
      </div>

      {/* View Switcher */}
      <div className="flex bg-muted rounded-lg p-1 w-fit mx-auto sm:mx-0">
        {(['month', 'week', 'day'] as CalendarView[]).map((viewOption) => (
          <Button
            key={viewOption}
            variant={view === viewOption ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange(viewOption)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
              view === viewOption
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            {viewLabels[viewOption]}
          </Button>
        ))}
      </div>
    </div>
  )
}