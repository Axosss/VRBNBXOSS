import { type Reservation } from '@/lib/stores/reservation-store'

interface PlatformBadgeProps {
  platform: Reservation['platform']
  className?: string
  size?: 'sm' | 'md'
}

const platformConfig = {
  airbnb: {
    label: 'Airbnb',
    className: 'bg-red-500 text-white',
    color: '#ff5a5f',
  },
  vrbo: {
    label: 'VRBO',
    className: 'bg-blue-600 text-white',
    color: '#0066cc',
  },
  direct: {
    label: 'Direct',
    className: 'bg-green-600 text-white',
    color: '#059669',
  },
  booking_com: {
    label: 'Booking.com',
    className: 'bg-blue-800 text-white',
    color: '#003580',
  },
  rent: {
    label: 'Loyer',
    className: 'bg-purple-600 text-white',
    color: '#8B5CF6',
  },
}

export function PlatformBadge({ platform, className = '', size = 'sm' }: PlatformBadgeProps) {
  const config = platformConfig[platform]
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClasses} ${className}`}>
      {config.label}
    </span>
  )
}

export function PlatformIcon({ platform, className = '' }: { platform: Reservation['platform'], className?: string }) {
  const config = platformConfig[platform]
  
  return (
    <div 
      className={`w-3 h-3 rounded-full ${className}`} 
      style={{ backgroundColor: config.color }}
      title={config.label}
    />
  )
}