'use client'

import { CalendarView, CalendarData } from '@/types/calendar'
import { CalendarMonthView } from './calendar-month-view'
import { CalendarWeekView } from './calendar-week-view'
import { CalendarDayView } from './calendar-day-view'

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
  const commonProps = {
    data,
    currentDate,
    onDateClick,
    onNavigate,
    className
  }

  switch (view) {
    case 'day':
      return <CalendarDayView {...commonProps} />
    case 'week':
      return <CalendarWeekView {...commonProps} />
    case 'month':
    default:
      return <CalendarMonthView {...commonProps} />
  }
}