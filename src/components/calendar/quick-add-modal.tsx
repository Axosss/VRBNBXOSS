'use client'

import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { QuickReservation } from '@/types/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog'
import { PlatformBadge } from '@/components/reservations/platform-badge'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Calendar, Users, DollarSign, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reservation: QuickReservation) => Promise<void>
  apartments: Array<{ id: string; name: string }>
  selectedDate?: Date | null
  selectedApartment?: string | null
}

const platformOptions = [
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'vrbo', label: 'VRBO' },
  { value: 'direct', label: 'Direct Booking' },
  { value: 'booking_com', label: 'Booking.com' }
] as const

export function QuickAddModal({
  isOpen,
  onClose,
  onSubmit,
  apartments,
  selectedDate,
  selectedApartment
}: QuickAddModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form data
  const [formData, setFormData] = useState<QuickReservation>({
    apartmentId: '',
    checkIn: '',
    checkOut: '',
    guestName: '',
    guestCount: 1,
    platform: 'direct',
    totalPrice: 0,
    notes: ''
  })

  // Initialize form with selected values
  useEffect(() => {
    if (isOpen) {
      const today = new Date()
      const checkInDate = selectedDate || today
      const checkOutDate = addDays(checkInDate, 1)
      
      setFormData({
        apartmentId: selectedApartment || '',
        checkIn: format(checkInDate, 'yyyy-MM-dd'),
        checkOut: format(checkOutDate, 'yyyy-MM-dd'),
        guestName: '',
        guestCount: 1,
        platform: 'direct',
        totalPrice: 0,
        notes: ''
      })
      setErrors({})
    }
  }, [isOpen, selectedDate, selectedApartment])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.apartmentId) {
      newErrors.apartmentId = 'Please select an apartment'
    }

    if (!formData.checkIn) {
      newErrors.checkIn = 'Check-in date is required'
    }

    if (!formData.checkOut) {
      newErrors.checkOut = 'Check-out date is required'
    }

    if (formData.checkIn && formData.checkOut) {
      const checkIn = new Date(formData.checkIn)
      const checkOut = new Date(formData.checkOut)
      
      if (checkOut <= checkIn) {
        newErrors.checkOut = 'Check-out must be after check-in'
      }
    }

    if (!formData.guestName.trim()) {
      newErrors.guestName = 'Guest name is required'
    }

    if (formData.guestCount < 1) {
      newErrors.guestCount = 'At least 1 guest is required'
    }

    if (formData.totalPrice < 0) {
      newErrors.totalPrice = 'Price cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
      onClose()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reservation'
      setErrors({
        submit: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof QuickReservation, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogClose onClose={onClose} />
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Quick Add Reservation
          </DialogTitle>
          <DialogDescription>
            Create a new reservation quickly from the calendar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Apartment Selection */}
          <div className="space-y-2">
            <Label htmlFor="apartment">Apartment *</Label>
            <Select
              value={formData.apartmentId}
              onValueChange={(value) => handleInputChange('apartmentId', value)}
            >
              <SelectTrigger className={cn(errors.apartmentId && 'border-destructive')}>
                <SelectValue placeholder="Select apartment" />
              </SelectTrigger>
              <SelectContent>
                {apartments.map((apartment) => (
                  <SelectItem key={apartment.id} value={apartment.id}>
                    {apartment.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.apartmentId && (
              <p className="text-sm text-destructive">{errors.apartmentId}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in *</Label>
              <Input
                id="checkIn"
                type="date"
                value={formData.checkIn}
                onChange={(e) => handleInputChange('checkIn', e.target.value)}
                className={cn(errors.checkIn && 'border-destructive')}
              />
              {errors.checkIn && (
                <p className="text-sm text-destructive">{errors.checkIn}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out *</Label>
              <Input
                id="checkOut"
                type="date"
                value={formData.checkOut}
                onChange={(e) => handleInputChange('checkOut', e.target.value)}
                className={cn(errors.checkOut && 'border-destructive')}
              />
              {errors.checkOut && (
                <p className="text-sm text-destructive">{errors.checkOut}</p>
              )}
            </div>
          </div>

          {/* Guest Information */}
          <div className="space-y-2">
            <Label htmlFor="guestName">Guest Name *</Label>
            <Input
              id="guestName"
              placeholder="Enter guest name"
              value={formData.guestName}
              onChange={(e) => handleInputChange('guestName', e.target.value)}
              className={cn(errors.guestName && 'border-destructive')}
            />
            {errors.guestName && (
              <p className="text-sm text-destructive">{errors.guestName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestCount">Number of Guests *</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="guestCount"
                type="number"
                min="1"
                max="20"
                value={formData.guestCount}
                onChange={(e) => handleInputChange('guestCount', parseInt(e.target.value) || 1)}
                className={cn('pl-10', errors.guestCount && 'border-destructive')}
              />
            </div>
            {errors.guestCount && (
              <p className="text-sm text-destructive">{errors.guestCount}</p>
            )}
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">Platform *</Label>
            <Select
              value={formData.platform}
              onValueChange={(value) => handleInputChange('platform', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {platformOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <PlatformBadge platform={option.value as 'airbnb' | 'vrbo' | 'direct' | 'booking_com'} size="sm" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total Price */}
          <div className="space-y-2">
            <Label htmlFor="totalPrice">Total Price</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="totalPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.totalPrice || ''}
                onChange={(e) => handleInputChange('totalPrice', parseFloat(e.target.value) || 0)}
                className={cn('pl-10', errors.totalPrice && 'border-destructive')}
              />
            </div>
            {errors.totalPrice && (
              <p className="text-sm text-destructive">{errors.totalPrice}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Optional notes or special requests"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="flex items-center gap-2 text-sm text-destructive p-3 bg-destructive/10 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {errors.submit}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Reservation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}