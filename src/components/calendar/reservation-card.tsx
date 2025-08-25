'use client'

import { format } from 'date-fns'
import { CalendarReservation } from '@/types/calendar'
import { PlatformBadge } from '@/components/reservations/platform-badge'
import { 
  getReservationStatusColor, 
  getApartmentColor,
  formatCurrency 
} from './calendar-utils'
import { cn } from '@/lib/utils'
import { 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign,
  Clock
} from 'lucide-react'

interface ReservationCardProps {
  reservation: CalendarReservation
  apartments: Array<{ id: string; name: string }>
  size?: 'sm' | 'md' | 'lg'
  showApartment?: boolean
  showPlatform?: boolean
  showStatus?: boolean
  showPrice?: boolean
  onClick?: () => void
  className?: string
}

export function ReservationCard({
  reservation,
  apartments,
  size = 'md',
  showApartment = true,
  showPlatform = true,
  showStatus = true,
  showPrice = false,
  onClick,
  className
}: ReservationCardProps) {
  const apartmentColor = getApartmentColor(reservation.apartment_id, apartments)
  const statusColor = getReservationStatusColor(reservation.status)
  
  const sizeClasses = {
    sm: 'p-2 text-xs',
    md: 'p-3 text-sm',
    lg: 'p-4 text-base'
  }

  return (
    <div
      className={cn(
        'rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-all',
        apartmentColor.bg,
        apartmentColor.border,
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      {/* Header with guest name and badges */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className={cn('font-semibold truncate', apartmentColor.text)}>
          {reservation.guest_name}
        </h3>
        
        <div className="flex items-center gap-1 shrink-0">
          {showPlatform && (
            <PlatformBadge 
              platform={reservation.platform} 
              size={size === 'lg' ? 'md' : 'sm'}
            />
          )}
          
          {showStatus && (
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium border',
              statusColor
            )}>
              {reservation.status}
            </span>
          )}
        </div>
      </div>

      {/* Apartment info */}
      {showApartment && (
        <div className={cn('flex items-center gap-1 mb-2', apartmentColor.text)}>
          <MapPin className="h-3 w-3 opacity-60" />
          <span className="text-sm opacity-75 truncate">
            {reservation.apartment_name}
          </span>
        </div>
      )}

      {/* Date range */}
      <div className={cn('flex items-center gap-1 mb-2', apartmentColor.text)}>
        <Calendar className="h-3 w-3 opacity-60" />
        <span className="text-sm">
          {format(new Date(reservation.check_in), 'MMM d')} - {format(new Date(reservation.check_out), 'MMM d')}
        </span>
        <span className="text-xs opacity-60 ml-1">
          ({reservation.nights} nights)
        </span>
      </div>

      {/* Guest count */}
      <div className={cn('flex items-center gap-1 mb-2', apartmentColor.text)}>
        <Users className="h-3 w-3 opacity-60" />
        <span className="text-sm">
          {reservation.guest_count} {reservation.guest_count === 1 ? 'guest' : 'guests'}
        </span>
      </div>

      {/* Price */}
      {showPrice && (
        <div className={cn('flex items-center gap-1', apartmentColor.text)}>
          <DollarSign className="h-3 w-3 opacity-60" />
          <span className="text-sm font-medium">
            {formatCurrency(reservation.total_price)}
          </span>
        </div>
      )}

      {/* Cleaning info if available */}
      {reservation.cleaning_status && (
        <div className={cn('flex items-center gap-1 mt-2 pt-2 border-t border-current border-opacity-20', apartmentColor.text)}>
          <Clock className="h-3 w-3 opacity-60" />
          <span className="text-xs opacity-75">
            Cleaning: {reservation.cleaning_status}
            {reservation.cleaning_date && (
              <span className="ml-1">
                on {format(new Date(reservation.cleaning_date), 'MMM d')}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Notes preview */}
      {reservation.notes && size !== 'sm' && (
        <div className={cn('mt-2 pt-2 border-t border-current border-opacity-20', apartmentColor.text)}>
          <p className="text-xs opacity-75 line-clamp-2">
            {reservation.notes}
          </p>
        </div>
      )}
    </div>
  )
}

// Compact version for calendar cells
export function ReservationChip({
  reservation,
  apartments,
  onClick,
  className
}: {
  reservation: CalendarReservation
  apartments: Array<{ id: string; name: string }>
  onClick?: () => void
  className?: string
}) {
  const apartmentColor = getApartmentColor(reservation.apartment_id, apartments)
  
  return (
    <div
      className={cn(
        'px-2 py-1 rounded text-xs border cursor-pointer hover:opacity-80 truncate',
        apartmentColor.bg,
        apartmentColor.border,
        apartmentColor.text,
        className
      )}
      onClick={onClick}
    >
      <div className="font-medium truncate">
        {reservation.guest_name}
      </div>
      <div className="opacity-75 truncate">
        {reservation.apartment_name}
      </div>
    </div>
  )
}