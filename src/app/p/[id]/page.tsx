'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isAfter, isBefore } from 'date-fns'
import { 
  MapPin, 
  Users, 
  Bed, 
  Bath,
  Wifi,
  Car,
  Coffee,
  Tv,
  Snowflake,
  Waves,
  Dumbbell,
  Shield,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { cn } from '@/lib/utils'

const AMENITY_ICONS: Record<string, any> = {
  'WiFi': Wifi,
  'Parking': Car,
  'Kitchen': Coffee,
  'TV': Tv,
  'AC': Snowflake,
  'Pool': Waves,
  'Gym': Dumbbell,
  'Security': Shield,
}

interface Apartment {
  id: string
  name: string
  capacity: number
  bedrooms: number
  bathrooms: number
  amenities: string[]
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  photos: Array<{
    id: string
    url: string
    display_order: number
    is_primary: boolean
  }>
  floor_plans: Array<{
    id: string
    url: string
    name: string
  }>
}

interface Availability {
  start: string
  end: string
  status: string
}

export default function PublicApartmentPage() {
  const params = useParams()
  const apartmentId = params.id as string
  
  const [apartment, setApartment] = useState<Apartment | null>(null)
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

  useEffect(() => {
    fetchApartmentData()
  }, [apartmentId])

  const fetchApartmentData = async () => {
    try {
      const response = await fetch(`/api/public/apartments/${apartmentId}`)
      
      if (!response.ok) {
        throw new Error('Apartment not found')
      }

      const data = await response.json()
      setApartment(data.apartment)
      setAvailability(data.availability)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load apartment')
    } finally {
      setLoading(false)
    }
  }

  const isDateBooked = (date: Date) => {
    return availability.some(block => {
      const start = new Date(block.start)
      const end = new Date(block.end)
      return !isBefore(date, start) && !isAfter(date, end)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !apartment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {error || 'Apartment not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle photos as array of strings (URLs)
  const photos = apartment.photos || []

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const firstDayOfWeek = monthStart.getDay()
  const emptyDays = Array(firstDayOfWeek).fill(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">{apartment.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {apartment.address.city}, {apartment.address.state}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photo Gallery */}
            {photos.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="relative aspect-[16/9]">
                    <img
                      src={photos[selectedPhotoIndex]}
                      alt={`${apartment.name} photo ${selectedPhotoIndex + 1}`}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                    {photos.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90"
                          onClick={() => setSelectedPhotoIndex((prev) => 
                            prev === 0 ? photos.length - 1 : prev - 1
                          )}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90"
                          onClick={() => setSelectedPhotoIndex((prev) => 
                            prev === photos.length - 1 ? 0 : prev + 1
                          )}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  {photos.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto">
                      {photos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedPhotoIndex(index)}
                          className={cn(
                            "flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors",
                            selectedPhotoIndex === index
                              ? "border-primary"
                              : "border-transparent"
                          )}
                        >
                          <img
                            src={photo}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Guests</p>
                      <p className="font-medium">{apartment.capacity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                      <p className="font-medium">{apartment.bedrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                      <p className="font-medium">{apartment.bathrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{apartment.address.city}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            {apartment.amenities && apartment.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {apartment.amenities.map((amenity) => {
                      const Icon = AMENITY_ICONS[amenity] || Coffee
                      return (
                        <div key={amenity} className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span>{amenity}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Sidebar - Availability Calendar */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-medium">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Weekday headers */}
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={`weekday-${i}`} className="text-xs font-medium text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                  
                  {/* Empty cells for alignment */}
                  {emptyDays.map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  
                  {/* Calendar days */}
                  {days.map((day) => {
                    const isBooked = isDateBooked(day)
                    const isToday = isSameDay(day, new Date())
                    const isPast = isBefore(day, new Date())
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "p-2 text-sm rounded-md",
                          isToday && "ring-2 ring-primary",
                          isBooked && "bg-red-100 text-red-900",
                          !isBooked && !isPast && "bg-green-50 text-green-900",
                          isPast && !isBooked && "text-muted-foreground"
                        )}
                      >
                        {format(day, 'd')}
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-50 rounded" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 rounded" />
                    <span>Booked</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                <address className="not-italic text-sm space-y-1">
                  <p>{apartment.address.street}</p>
                  <p>
                    {apartment.address.city}, {apartment.address.state} {apartment.address.zipCode}
                  </p>
                  <p>{apartment.address.country}</p>
                </address>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}