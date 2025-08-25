'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { 
  Filter,
  X,
  Building,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarFiltersProps {
  apartments: Array<{ id: string; name: string }>
  selectedApartments: string[]
  onApartmentChange: (apartmentIds: string[]) => void
  includeCleanings: boolean
  onIncludeCleaningsChange: (include: boolean) => void
  className?: string
}

export function CalendarFilters({
  apartments,
  selectedApartments,
  onApartmentChange,
  includeCleanings,
  onIncludeCleaningsChange,
  className
}: CalendarFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleApartmentToggle = (apartmentId: string) => {
    if (selectedApartments.includes(apartmentId)) {
      onApartmentChange(selectedApartments.filter(id => id !== apartmentId))
    } else {
      onApartmentChange([...selectedApartments, apartmentId])
    }
  }

  const handleSelectAll = () => {
    if (selectedApartments.length === apartments.length) {
      onApartmentChange([])
    } else {
      onApartmentChange(apartments.map(apt => apt.id))
    }
  }

  const clearAllFilters = () => {
    onApartmentChange([])
    onIncludeCleaningsChange(false)
  }

  const hasActiveFilters = selectedApartments.length > 0 || includeCleanings

  return (
    <div className={cn('calendar-filters', className)}>
      {/* Filter toggle button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2',
            hasActiveFilters && 'border-primary text-primary'
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <div className="bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5 ml-1">
              {(selectedApartments.length > 0 ? 1 : 0) + (includeCleanings ? 1 : 0)}
            </div>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {isOpen && (
        <Card className="mt-2 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">Filter Calendar</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Apartment filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Apartments
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedApartments.length === apartments.length ? 'Deselect all' : 'Select all'}
              </Button>
            </div>

            {apartments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {apartments.map((apartment) => {
                  const isSelected = selectedApartments.includes(apartment.id)
                  
                  return (
                    <Button
                      key={apartment.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleApartmentToggle(apartment.id)}
                      className="justify-start text-left"
                    >
                      <div className="truncate">
                        {apartment.name}
                      </div>
                    </Button>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No apartments available
              </p>
            )}
          </div>

          {/* Additional options */}
          <div className="space-y-3 pt-3 border-t">
            <Label className="text-sm font-medium">Display Options</Label>
            
            <div className="flex items-center gap-3">
              <Button
                variant={includeCleanings ? "default" : "outline"}
                size="sm"
                onClick={() => onIncludeCleaningsChange(!includeCleanings)}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Include Cleanings
              </Button>
            </div>
          </div>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="pt-3 border-t">
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Active Filters
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedApartments.length > 0 && (
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                    <Building className="h-3 w-3" />
                    {selectedApartments.length === apartments.length 
                      ? 'All apartments'
                      : `${selectedApartments.length} ${selectedApartments.length === 1 ? 'apartment' : 'apartments'}`
                    }
                  </div>
                )}
                
                {includeCleanings && (
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                    <Sparkles className="h-3 w-3" />
                    Cleanings shown
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}