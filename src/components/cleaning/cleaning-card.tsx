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

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) {
      return {
        date: 'Invalid Date',
        time: 'Invalid Date'
      }
    }
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return {
        date: 'Invalid Date',
        time: 'Invalid Date'
      }
    }
    
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const scheduledStart = formatDateTime(cleaning.scheduledStart)
  const scheduledEnd = formatDateTime(cleaning.scheduledEnd)
  
  // Don't render cleanings with invalid dates
  if (scheduledStart.date === 'Invalid Date' || scheduledEnd.date === 'Invalid Date') {
    console.warn('Cleaning with invalid dates found:', {
      id: cleaning.id,
      scheduledStart: cleaning.scheduledStart,
      scheduledEnd: cleaning.scheduledEnd
    })
    return null
  }

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  // Only allow cancelling active cleanings
  const statusActions = cleaning.status === 'active' 
    ? [{ label: 'Cancel Cleaning', status: 'cancelled' as CleaningStatus, icon: XCircle, variant: 'destructive' as const }]
    : []

  const urgencyColor = () => {
    // Simple - no urgency colors, keep it clean
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
                {cleaning.cleaningType.charAt(0).toUpperCase() + cleaning.cleaningType.slice(1)} Cleaning
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
                
                {!cleaning.cleanerId && onAssignCleaner && (
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

        {/* Show if cleaning was cancelled */}
        {cleaning.status === 'cancelled' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4" />
            <span>This cleaning was cancelled</span>
          </div>
        )}

        {/* No urgency indicators - cleanings are purely informational */}
      </CardContent>
    </Card>
  )
}