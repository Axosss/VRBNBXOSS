'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Users, DollarSign, MapPin, User, Phone, Mail, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { PlatformBadge } from './platform-badge'
import { useApartmentStore } from '@/lib/stores/apartment-store'
import { useReservationStore } from '@/lib/stores/reservation-store'
import { reservationCreateSchema, type ReservationCreateInput } from '@/lib/validations'

interface ReservationFormProps {
  initialData?: Partial<ReservationCreateInput>
  mode: 'create' | 'edit'
  onSubmit: (data: ReservationCreateInput) => Promise<void>
  onCancel: () => void
}

interface GuestData {
  id?: string
  name: string
  email?: string
  phone?: string
}

const platformFields = {
  airbnb: {
    label: 'Airbnb',
    color: '#ff5a5f',
    fields: ['platformReservationId'],
    descriptions: {
      platformReservationId: 'Airbnb reservation ID (e.g., HMABCD1234)'
    }
  },
  vrbo: {
    label: 'VRBO',
    color: '#0066cc', 
    fields: ['platformReservationId'],
    descriptions: {
      platformReservationId: 'VRBO reservation ID'
    }
  },
  direct: {
    label: 'Direct Booking',
    color: '#059669',
    fields: ['contactInfo'],
    descriptions: {
      contactInfo: 'Additional contact information and documentation required for direct bookings'
    }
  },
  booking_com: {
    label: 'Booking.com',
    color: '#003580',
    fields: ['platformReservationId'],
    descriptions: {
      platformReservationId: 'Booking.com reservation number'
    }
  }
}

export function ReservationForm({ initialData, mode, onSubmit, onCancel }: ReservationFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availabilityChecked, setAvailabilityChecked] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [guestData, setGuestData] = useState<GuestData>({
    name: '',
    email: '',
    phone: ''
  })

  const { apartments, fetchApartments } = useApartmentStore()
  const { checkAvailability } = useReservationStore()

  const form = useForm<ReservationCreateInput>({
    resolver: zodResolver(reservationCreateSchema),
    defaultValues: {
      apartmentId: '',
      guestId: null,
      platform: 'direct',
      platformReservationId: '',
      checkIn: '',
      checkOut: '',
      guestCount: 1,
      totalPrice: 0,
      cleaningFee: 0,
      platformFee: 0,
      currency: 'USD',
      notes: '',
      contactInfo: {},
      ...initialData,
    },
  })

  const watchedValues = form.watch()
  const selectedPlatform = watchedValues.platform
  const selectedApartmentId = watchedValues.apartmentId
  const checkInDate = watchedValues.checkIn
  const checkOutDate = watchedValues.checkOut

  useEffect(() => {
    fetchApartments({ limit: 100 })
  }, [fetchApartments])

  const selectedApartment = apartments.find(apt => apt.id === selectedApartmentId)

  const validateAvailability = async () => {
    if (!selectedApartmentId || !checkInDate || !checkOutDate) {
      setAvailabilityError('Please select apartment and dates first')
      return false
    }

    try {
      setAvailabilityError(null)
      const isAvailable = await checkAvailability(
        selectedApartmentId, 
        checkInDate, 
        checkOutDate,
        mode === 'edit' ? initialData?.apartmentId : undefined
      )
      
      if (!isAvailable) {
        setAvailabilityError('The selected dates are not available for this apartment')
        setAvailabilityChecked(false)
        return false
      }
      
      setAvailabilityChecked(true)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check availability'
      
      // Check if it's an authentication error
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        setAvailabilityError('Please log in to check availability.')
      } else {
        setAvailabilityError('Failed to check availability. Please try again.')
      }
      
      setAvailabilityChecked(false)
      return false
    }
  }

  const handleSubmit = async (data: ReservationCreateInput) => {
    try {
      setIsSubmitting(true)
      
      // Include guest data if creating new guest
      if (!data.guestId && guestData.name) {
        // This would typically create a guest first, but for now we'll include contact info
        data.contactInfo = {
          ...data.contactInfo,
          guestName: guestData.name,
          guestEmail: guestData.email,
          guestPhone: guestData.phone
        }
      }

      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToStep2 = selectedApartmentId && checkInDate && checkOutDate && availabilityChecked
  const canProceedToStep3 = guestData.name || watchedValues.guestId
  const canProceedToStep4 = selectedPlatform && watchedValues.guestCount > 0 && watchedValues.totalPrice > 0

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${currentStep >= step 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
              }
            `}>
              {currentStep > step ? <Check className="h-4 w-4" /> : step}
            </div>
            {step < 4 && (
              <div className={`
                w-16 h-0.5 mx-2
                ${currentStep > step ? 'bg-primary' : 'bg-muted'}
              `} />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Step 1: Property & Dates */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Property & Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="apartmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a property" />
                          </SelectTrigger>
                          <SelectContent>
                            {apartments.filter(apt => apt.status === 'active').map(apartment => (
                              <SelectItem key={apartment.id} value={apartment.id}>
                                <div className="flex items-center gap-2">
                                  <span>{apartment.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    • {apartment.capacity} guests
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedApartment && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Address:</strong> {selectedApartment.address.street}, {selectedApartment.address.city}</p>
                      <p><strong>Capacity:</strong> {selectedApartment.capacity} guests</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-in Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="checkOut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-out Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            min={checkInDate || new Date().toISOString().split('T')[0]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Availability check */}
                {selectedApartmentId && checkInDate && checkOutDate && (
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={validateAvailability}
                      className="w-full"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Check Availability
                    </Button>
                    
                    {availabilityError && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {availabilityError}
                      </div>
                    )}
                    
                    {availabilityChecked && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="h-4 w-4" />
                        Dates are available!
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Guest Information */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Guest Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guestName">Guest Name *</Label>
                      <Input
                        id="guestName"
                        value={guestData.name}
                        onChange={(e) => setGuestData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Primary guest name"
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="guestCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Guests</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max={selectedApartment?.capacity || 10}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guestEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="guestEmail"
                          type="email"
                          value={guestData.email}
                          onChange={(e) => setGuestData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="guest@example.com"
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="guestPhone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="guestPhone"
                          type="tel"
                          value={guestData.phone}
                          onChange={(e) => setGuestData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Platform & Pricing */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Platform & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking Platform</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(platformFields).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: config.color }} 
                                  />
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Platform-specific fields */}
                {selectedPlatform && platformFields[selectedPlatform].fields.includes('platformReservationId') && (
                  <FormField
                    control={form.control}
                    name="platformReservationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Reservation ID</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={platformFields[selectedPlatform].descriptions.platformReservationId}
                          />
                        </FormControl>
                        <FormDescription>
                          {platformFields[selectedPlatform].descriptions.platformReservationId}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="totalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cleaningFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cleaning Fee</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="platformFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Fee</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Reservation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Property</h4>
                      <p className="text-sm text-muted-foreground">{selectedApartment?.name}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Guest</h4>
                      <p className="text-sm text-muted-foreground">
                        {guestData.name} • {watchedValues.guestCount} guest{watchedValues.guestCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Dates</h4>
                      <p className="text-sm text-muted-foreground">
                        {checkInDate && new Date(checkInDate).toLocaleDateString()} - {checkOutDate && new Date(checkOutDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Platform</h4>
                      <PlatformBadge platform={selectedPlatform} />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Pricing</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Total Price:</span>
                          <span>{watchedValues.totalPrice} {watchedValues.currency}</span>
                        </div>
                        {watchedValues.cleaningFee > 0 && (
                          <div className="flex justify-between">
                            <span>Cleaning Fee:</span>
                            <span>{watchedValues.cleaningFee} {watchedValues.currency}</span>
                          </div>
                        )}
                        {watchedValues.platformFee > 0 && (
                          <div className="flex justify-between">
                            <span>Platform Fee:</span>
                            <span>{watchedValues.platformFee} {watchedValues.currency}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          placeholder="Add any special notes or requirements..."
                          className="w-full h-20 px-3 py-2 text-sm border border-input bg-background rounded-md resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              {currentStep < 4 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !canProceedToStep2) ||
                    (currentStep === 2 && !canProceedToStep3) ||
                    (currentStep === 3 && !canProceedToStep4)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner className="h-4 w-4 mr-2" />
                      {mode === 'create' ? 'Creating...' : 'Updating...'}
                    </>
                  ) : (
                    mode === 'create' ? 'Create Reservation' : 'Update Reservation'
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}