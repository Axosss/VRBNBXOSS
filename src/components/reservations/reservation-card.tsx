import { CalendarDays, Users, MapPin, DollarSign, MessageCircle, Edit, Trash2, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ReservationStatusBadge } from './reservation-status-badge'
import { PlatformBadge, PlatformIcon } from './platform-badge'
import { type Reservation } from '@/lib/stores/reservation-store'

interface ReservationCardProps {
  reservation: Reservation
  viewMode: 'grid' | 'list'
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ReservationCard({ 
  reservation, 
  viewMode, 
  onView, 
  onEdit, 
  onDelete 
}: ReservationCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR', // Always force EUR display
    }).format(amount)
  }

  const getDuration = () => {
    const checkIn = new Date(reservation.checkIn)
    const checkOut = new Date(reservation.checkOut)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
        <CardContent className="p-4">
          <div className="flex gap-4 items-start">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {reservation.guest?.name || 
                     (reservation.contactInfo as any)?.name || 
                     'Guest'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {reservation.apartment?.name || 'Apartment'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ReservationStatusBadge status={reservation.status} />
                  <PlatformBadge platform={reservation.platform} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  <span>{formatDate(reservation.checkIn)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  <span>{formatDate(reservation.checkOut)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{reservation.guestCount} guests</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>{formatCurrency(reservation.totalPrice, reservation.currency)}</span>
                  {(reservation.cleaningFee || reservation.platformFee) && (
                    <span className="text-xs text-muted-foreground">
                      (+{formatCurrency((reservation.cleaningFee || 0) + (reservation.platformFee || 0), reservation.currency)} fees)
                    </span>
                  )}
                </div>
              </div>

              {reservation.notes && (
                <div className="flex items-start gap-1 mt-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{reservation.notes}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onView()
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {reservation.status === 'draft' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={onView}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">
              {reservation.guest?.name || 
               (reservation.contactInfo as any)?.name || 
               'Guest'}
            </CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {reservation.apartment?.name || 'Apartment'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <PlatformBadge platform={reservation.platform} />
            <ReservationStatusBadge status={reservation.status} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Dates */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Check-in</span>
            <span className="font-medium">{formatDate(reservation.checkIn)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Check-out</span>
            <span className="font-medium">{formatDate(reservation.checkOut)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">{getDuration()} nights</span>
          </div>
          
          {/* Details */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Guests</span>
            <span className="font-medium">{reservation.guestCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(reservation.totalPrice, reservation.currency)}
            </span>
          </div>
          {reservation.cleaningFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cleaning fee</span>
              <span className="text-muted-foreground">
                {formatCurrency(reservation.cleaningFee, reservation.currency)}
              </span>
            </div>
          )}
          {reservation.platformFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Platform fee</span>
              <span className="text-muted-foreground">
                {formatCurrency(reservation.platformFee, reservation.currency)}
              </span>
            </div>
          )}

          {reservation.notes && (
            <div className="pt-2 border-t">
              <div className="flex items-start gap-1 text-sm text-muted-foreground">
                <MessageCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span className="text-xs line-clamp-2">{reservation.notes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          {reservation.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="text-destructive hover:text-destructive border-destructive/20 hover:border-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}