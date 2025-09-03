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
  // Only month view is supported now
  return format(date, 'MMMM yyyy')
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
    // Only month view is supported now
    return currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear()
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

      {/* View Switcher - Removed as only month view is supported */}
    </div>
  )
}