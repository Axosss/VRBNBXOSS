'use client'

import { cn } from '@/lib/utils'
import { CalendarReservation } from '@/types/calendar'
import { format } from 'date-fns'

interface ReservationBarProps {
  reservation: CalendarReservation
  color: {
    bg: string
    border: string
    text: string
    dot: string
  }
  position: {
    row: number
    startCol: number
    span: number
  }
  onClick?: () => void
}

export function ReservationBar({
  reservation,
  color,
  position,
  onClick
}: ReservationBarProps) {
  const nights = position.span
  const totalPrice = reservation.totalPrice || 0

  return (
    <div
      className={cn(
        'absolute h-8 px-2 py-1 cursor-pointer transition-all hover:z-20 hover:shadow-lg',
        'flex items-center justify-between pointer-events-auto',
        color.bg,
        color.border,
        color.text,
        'border',
        'overflow-hidden'
      )}
      style={{
        gridRow: position.row,
        gridColumn: `${position.startCol} / span ${position.span}`,
        borderRadius: '6px'
      }}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 min-w-0">
        {reservation.guestAvatar && (
          <img 
            src={reservation.guestAvatar} 
            alt={reservation.guestName}
            className="w-5 h-5 rounded-full flex-shrink-0"
          />
        )}
        <div className="truncate">
          <span className="font-medium text-sm">
            {reservation.guestName}
          </span>
          {nights > 1 && (
            <span className="text-xs ml-1 opacity-75">
              • {nights} {nights === 1 ? 'nuit' : 'nuits'}
            </span>
          )}
        </div>
      </div>
      
      {position.span >= 3 && totalPrice > 0 && (
        <div className="text-sm font-medium flex-shrink-0 ml-2">
          {totalPrice.toFixed(0)}€
        </div>
      )}
    </div>
  )
}