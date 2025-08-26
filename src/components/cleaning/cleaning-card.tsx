'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  XCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { CleaningStatusBadge } from './cleaning-status-badge'
import { cn } from '@/lib/utils'
import type { Cleaning, CleaningStatus } from '@/types/cleaning'

interface CleaningCardProps {
  cleaning: Cleaning
  onEdit?: (cleaning: Cleaning) => void
  onDelete?: (id: string) => void
  onStatusChange?: (id: string, status: CleaningStatus) => void
  onAssignCleaner?: (cleaning: Cleaning) => void
  onClick?: (cleaning: Cleaning) => void
  className?: string
  showActions?: boolean
  compact?: boolean
}

export function CleaningCard({ 
  cleaning, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onAssignCleaner,
  onClick,
  className,
  showActions = true,
  compact = false
}: CleaningCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusChange = async (newStatus: CleaningStatus) => {
    if (!onStatusChange) return
    
    setIsLoading(true)
    try {
      await onStatusChange(cleaning.id, newStatus)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const scheduledStart = formatDateTime(cleaning.scheduled_start)
  const scheduledEnd = formatDateTime(cleaning.scheduled_end)

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getStatusActions = (currentStatus: CleaningStatus): Array<{
    label: string
    status: CleaningStatus
    icon: any
    variant?: 'default' | 'destructive'
  }> => {
    switch (currentStatus) {
      case 'needed':
        return [
          { label: 'Mark Scheduled', status: 'scheduled', icon: Calendar },
          { label: 'Cancel', status: 'cancelled', icon: XCircle, variant: 'destructive' }
        ]
      case 'scheduled':
        return [
          { label: 'Start Cleaning', status: 'in_progress', icon: PlayCircle },
          { label: 'Cancel', status: 'cancelled', icon: XCircle, variant: 'destructive' }
        ]
      case 'in_progress':
        return [
          { label: 'Mark Completed', status: 'completed', icon: CheckCircle2 }
        ]
      case 'completed':
        return [
          { label: 'Verify', status: 'verified', icon: CheckCircle2 }
        ]
      default:
        return []
    }
  }

  const statusActions = getStatusActions(cleaning.status)

  const urgencyColor = () => {
    const now = new Date()
    const scheduledTime = new Date(cleaning.scheduled_start)
    const hoursUntil = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (cleaning.status === 'needed' && hoursUntil <= 2) {
      return 'border-l-red-500 bg-red-50'
    }
    if (cleaning.status === 'scheduled' && hoursUntil <= 1) {
      return 'border-l-orange-500 bg-orange-50'
    }
    return ''
  }

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md border-l-4 border-l-transparent",
        urgencyColor(),
        onClick && "cursor-pointer hover:shadow-lg",
        compact && "p-3",
        className
      )}
      onClick={onClick ? () => onClick(cleaning) : undefined}
    >
      <CardHeader className={cn("pb-3", compact && "pb-2 px-0")}>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className={cn("text-lg font-semibold", compact && "text-base")}>
                {cleaning.cleaning_type.charAt(0).toUpperCase() + cleaning.cleaning_type.slice(1)} Cleaning
              </CardTitle>
              <CleaningStatusBadge status={cleaning.status} />
            </div>
            
            {cleaning.apartment && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{cleaning.apartment.name}</span>
              </div>
            )}
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  disabled={isLoading}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {statusActions.map((action) => (
                  <DropdownMenuItem 
                    key={action.status}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange(action.status)
                    }}
                    disabled={isLoading}
                    className={action.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
                
                {statusActions.length > 0 && <DropdownMenuSeparator />}
                
                {!cleaning.cleaner_id && onAssignCleaner && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation()
                      onAssignCleaner(cleaning)
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Cleaner
                  </DropdownMenuItem>
                )}
                
                {onEdit && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(cleaning)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                )}
                
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(cleaning.id)
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-3", compact && "px-0 space-y-2")}>
        {/* Schedule Information */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{scheduledStart.date}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{scheduledStart.time} - {scheduledEnd.time}</span>
          </div>
        </div>

        {/* Cleaner Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            {cleaning.cleaner ? (
              <span className="font-medium">{cleaning.cleaner.name}</span>
            ) : (
              <span className="text-muted-foreground italic">No cleaner assigned</span>
            )}
          </div>
          
          {cleaning.cost && (
            <div className="flex items-center gap-1 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              <span>{formatCurrency(cleaning.cost, cleaning.currency)}</span>
            </div>
          )}
        </div>

        {/* Reservation Link */}
        {cleaning.reservation && (
          <div className="text-sm text-muted-foreground">
            <span>After checkout: </span>
            <span className="font-medium">{cleaning.reservation.guest_name}</span>
            <span className="mx-1">•</span>
            <span>{new Date(cleaning.reservation.check_out).toLocaleDateString()}</span>
          </div>
        )}

        {/* Instructions */}
        {cleaning.instructions && !compact && (
          <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
            <p className="line-clamp-2">{cleaning.instructions}</p>
          </div>
        )}

        {/* Actual times for completed cleanings */}
        {cleaning.status === 'completed' || cleaning.status === 'verified' ? (
          cleaning.actual_start && cleaning.actual_end && (
            <div className="flex items-center gap-4 text-sm text-green-700 bg-green-50 p-2 rounded">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Completed:</span>
              </div>
              <span>
                {formatDateTime(cleaning.actual_start).time} - {formatDateTime(cleaning.actual_end).time}
              </span>
            </div>
          )
        ) : null}

        {/* Urgency indicator for overdue items */}
        {cleaning.status === 'needed' && new Date(cleaning.scheduled_start) < new Date() && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Overdue - needs immediate attention</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}