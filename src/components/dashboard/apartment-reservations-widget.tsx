'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Home, User, Clock, CalendarCheck } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Guest {
  id: string
  name: string
}

interface Reservation {
  id: string
  checkIn: string
  checkOut: string
  guest: Guest | null
  daysRemaining?: number
}

interface Apartment {
  id: string
  name: string
  address?: {
    street?: string
    city?: string
  }
}

interface ApartmentReservation {
  apartment: Apartment
  currentReservation: Reservation | null
  nextReservation: Reservation | null
}

export function ApartmentReservationsWidget() {
  const [apartmentReservations, setApartmentReservations] = useState<ApartmentReservation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch('/api/dashboard/apartment-reservations')
        const data = await response.json()

        if (data.success && data.data) {
          setApartmentReservations(data.data.apartments || [])
        }
      } catch (error) {
        console.error('Failed to fetch apartment reservations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReservations()

    // Refresh every 5 minutes
    const interval = setInterval(fetchReservations, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatDateRange = (checkIn: string, checkOut: string) => {
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    // Format: "17-20 sept."
    if (checkInDate.getMonth() === checkOutDate.getMonth()) {
      return `${checkInDate.getDate()}-${checkOutDate.getDate()} ${format(checkInDate, 'MMM', { locale: fr })}.`
    } else {
      // Format: "28 sept. - 3 oct."
      return `${checkInDate.getDate()} ${format(checkInDate, 'MMM', { locale: fr })}. - ${checkOutDate.getDate()} ${format(checkOutDate, 'MMM', { locale: fr })}.`
    }
  }

  const getDaysRemainingText = (daysRemaining: number) => {
    if (daysRemaining === 0) {
      return "Check-out aujourd'hui"
    } else if (daysRemaining === 1) {
      return "Check-out demain"
    } else {
      return `${daysRemaining} jours restants`
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (apartmentReservations.length === 0) {
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {apartmentReservations.map((item) => (
        <Card key={item.apartment.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span>{item.apartment.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Reservation */}
            {item.currentReservation && (
              <div className="space-y-3 pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-green-600">En cours</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {getDaysRemainingText(item.currentReservation.daysRemaining || 0)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {item.currentReservation.guest?.name || 'Guest'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Check-out: {format(new Date(item.currentReservation.checkOut), 'EEEE d MMMM', { locale: fr })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Next Reservation */}
            {item.nextReservation && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm font-medium text-blue-600">À venir</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {item.nextReservation.guest?.name || 'Guest'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatDateRange(item.nextReservation.checkIn, item.nextReservation.checkOut)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* No Reservations */}
            {!item.currentReservation && !item.nextReservation && (
              <div className="text-center py-4">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune réservation</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}