'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CleaningStatus } from '@/types/cleaning'

interface CleaningStatusBadgeProps {
  status: CleaningStatus
  className?: string
}

const statusConfig = {
  needed: {
    label: 'Needed',
    variant: 'secondary' as const,
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
  },
  scheduled: {
    label: 'Scheduled',
    variant: 'outline' as const,
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
  },
  in_progress: {
    label: 'In Progress',
    variant: 'default' as const,
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300'
  },
  completed: {
    label: 'Completed',
    variant: 'secondary' as const,
    className: 'bg-green-100 text-green-800 hover:bg-green-200'
  },
  verified: {
    label: 'Verified',
    variant: 'default' as const,
    className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300'
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300'
  }
}

export function CleaningStatusBadge({ status, className }: CleaningStatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}