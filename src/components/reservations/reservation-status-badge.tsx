import { type Reservation } from '@/lib/stores/reservation-store'

interface ReservationStatusBadgeProps {
  status: Reservation['status']
  className?: string
}

const statusConfig = {
  confirmed: {
    label: 'Confirmée',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  cancelled: {
    label: 'Annulée',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
}

export function ReservationStatusBadge({ status, className = '' }: ReservationStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.className} ${className}`}>
      {config.label}
    </span>
  )
}