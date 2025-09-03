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
import { User, Star, DollarSign } from 'lucide-react'
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
}

export function CleanerSelector({ 
  value, 
  onValueChange,
  apartmentId,
  scheduledDate,
  className,
  placeholder = "Select cleaner...",
  disabled = false
}: CleanerSelectorProps) {
  const { cleaners, fetchCleaners, isLoading } = useCleaningStore()

  useEffect(() => {
    // Only fetch if cleaners are not already loaded
    if (cleaners.length === 0 && !isLoading) {
      fetchCleaners({ active: true })
    }
  }, []) // Empty dependency array - only run once on mount


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
    // Sort by rating (highest first)
    if (a.rating && b.rating) {
      return b.rating - a.rating
    }
    if (a.rating && !b.rating) return -1
    if (!a.rating && b.rating) return 1
    
    // Then sort by name
    return a.name.localeCompare(b.name)
  })

  return (
    <div className={cn("space-y-1", className)}>
      <Select
        value={value || ''}
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
            return (
              <SelectItem 
                key={cleaner.id} 
                value={cleaner.id}
                className="px-2 py-3"
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
    </div>
  )
}