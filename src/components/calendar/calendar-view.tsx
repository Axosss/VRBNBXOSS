'use client'

import { CalendarView, CalendarData } from '@/types/calendar'
import { CalendarMonthView } from './calendar-month-view'

interface CalendarViewComponentProps {
  data: CalendarData
  view: CalendarView
  currentDate: Date
  onDateClick: (date: Date, apartmentId?: string) => void
  onNavigate: (direction: 'prev' | 'next') => void
  className?: string
}

export function CalendarViewComponent({
  data,
  view,
  currentDate,
  onDateClick,
  onNavigate,
  className
}: CalendarViewComponentProps) {
  // Only month view is supported now
  return (
    <CalendarMonthView
      data={data}
      currentDate={currentDate}
      onDateClick={onDateClick}
      onNavigate={onNavigate}
      className={className}
    />
  )
}