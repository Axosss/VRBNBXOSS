'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Star, DollarSign, AlertCircle, CheckCircle } from 'lucide-react'
import { useCleaningStore } from '@/lib/stores/cleaning-store'
import { cn } from '@/lib/utils'
import type { Cleaner } from '@/types/cleaning'

interface CleanerSelectorProps {
  value?: string | null
  onValueChange?: (cleanerId: string | null) => void
  apartmentId?: string
  scheduledDate?: string
  className?: string
  placeholder?: string
  disabled?: boolean
  showAvailability?: boolean
}

export function CleanerSelector({ 
  value, 
  onValueChange,
  apartmentId,
  scheduledDate,
  className,
  placeholder = "Select cleaner...",
  disabled = false,
  showAvailability = false
}: CleanerSelectorProps) {
  const { cleaners, fetchCleaners, isLoading } = useCleaningStore()
  const [availabilityStatus, setAvailabilityStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchCleaners({ active: true })
  }, [fetchCleaners])

  // Check cleaner availability if date and apartment are provided
  useEffect(() => {
    if (showAvailability && scheduledDate && apartmentId && cleaners.length > 0) {
      // This would typically make an API call to check availability
      // For now, we'll simulate availability checking
      const checkAvailability = async () => {
        const availability: Record<string, boolean> = {}
        cleaners.forEach(cleaner => {
          // Simulate availability check - in real implementation this would be an API call
          availability[cleaner.id] = Math.random() > 0.3 // 70% chance of being available
        })
        setAvailabilityStatus(availability)
      }
      
      checkAvailability()
    }
  }, [showAvailability, scheduledDate, apartmentId, cleaners])

  const getCleanerInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getCleanerRate = (cleaner: Cleaner) => {
    if (cleaner.hourly_rate) {
      return `${formatCurrency(cleaner.hourly_rate, cleaner.currency)}/hr`
    }
    if (cleaner.flat_rate) {
      return `${formatCurrency(cleaner.flat_rate, cleaner.currency)} flat`
    }
    return 'Rate not set'
  }

  const sortedCleaners = [...cleaners].sort((a, b) => {
    // Sort by availability first (if checking availability)
    if (showAvailability && scheduledDate) {
      const aAvailable = availabilityStatus[a.id] ?? true
      const bAvailable = availabilityStatus[b.id] ?? true
      if (aAvailable !== bAvailable) {
        return bAvailable ? 1 : -1
      }
    }
    
    // Then sort by rating (highest first)
    if (a.rating && b.rating) {
      return b.rating - a.rating
    }
    if (a.rating && !b.rating) return -1
    if (!a.rating && b.rating) return 1
    
    // Finally sort by name
    return a.name.localeCompare(b.name)
  })

  return (
    <div className={cn("space-y-1", className)}>
      <Select
        value={value || undefined}
        onValueChange={(selectedValue) => {
          onValueChange?.(selectedValue === 'none' ? null : selectedValue)
        }}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? "Loading cleaners..." : placeholder}>
            {value && cleaners.length > 0 && (() => {
              const selectedCleaner = cleaners.find(c => c.id === value)
              if (selectedCleaner) {
                return (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getCleanerInitials(selectedCleaner.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{selectedCleaner.name}</span>
                    {selectedCleaner.rating && (
                      <div className="flex items-center gap-1 text-amber-600 ml-auto">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs">{selectedCleaner.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                )
              }
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Option to clear selection */}
          <SelectItem value="none">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>No cleaner assigned</span>
            </div>
          </SelectItem>

          {sortedCleaners.map((cleaner) => {
            const isAvailable = showAvailability && scheduledDate 
              ? availabilityStatus[cleaner.id] ?? true 
              : true

            return (
              <SelectItem 
                key={cleaner.id} 
                value={cleaner.id}
                className={cn(
                  "px-2 py-3",
                  !isAvailable && "opacity-60"
                )}
                disabled={!isAvailable}
              >
                <div className="flex items-center gap-3 w-full min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getCleanerInitials(cleaner.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{cleaner.name}</span>
                      
                      {/* Availability indicator */}
                      {showAvailability && scheduledDate && (
                        <div className="shrink-0">
                          {isAvailable ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {/* Rating */}
                      {cleaner.rating && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{cleaner.rating.toFixed(1)}</span>
                        </div>
                      )}
                      
                      {/* Rate */}
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{getCleanerRate(cleaner)}</span>
                      </div>
                      
                      {/* Supplies included badge */}
                      {cleaner.supplies_included && (
                        <Badge variant="outline" className="text-xs py-0 px-1">
                          Supplies
                        </Badge>
                      )}
                      
                      {/* Job count */}
                      <span>• {cleaner.total_cleanings} jobs</span>
                    </div>
                  </div>
                </div>
              </SelectItem>
            )
          })}

          {cleaners.length === 0 && !isLoading && (
            <SelectItem value="empty" disabled>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>No cleaners available</span>
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      
      {/* Availability legend */}
      {showAvailability && scheduledDate && cleaners.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-orange-600" />
            <span>Busy</span>
          </div>
        </div>
      )}
    </div>
  )
}