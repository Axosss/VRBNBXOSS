'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CleaningStatus } from '@/types/cleaning'

interface CleaningStatusBadgeProps {
  status: CleaningStatus
  className?: string
}

const statusConfig = {
  active: {
    label: 'Active',
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  }
}

export function CleaningStatusBadge({ status, className }: CleaningStatusBadgeProps) {
  // Map legacy statuses to new simplified statuses
  const mappedStatus = (() => {
    if (status === 'cancelled') return 'cancelled'
    // Map all other statuses (scheduled, completed, in_progress, needed, verified) to 'active'
    return 'active'
  })()
  
  const config = statusConfig[mappedStatus]
  
  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}