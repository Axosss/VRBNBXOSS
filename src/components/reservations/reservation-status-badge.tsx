import { type Reservation } from '@/lib/stores/reservation-store'

interface ReservationStatusBadgeProps {
  status: Reservation['status']
  className?: string
}

const statusConfig = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  checked_in: {
    label: 'Checked In',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  checked_out: {
    label: 'Checked Out',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
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