'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  Edit,
  Trash2,
  UserCheck,
  Clock,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { useGuestStore } from '@/lib/stores/guest-store'
import { cn } from '@/lib/utils'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface GuestDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function GuestDetailPage({ params }: GuestDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const {
    selectedGuest,
    loading,
    error,
    fetchGuestById,
    updateGuest,
    deleteGuest,
    clearError
  } = useGuestStore()

  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchGuestById(resolvedParams.id)
  }, [resolvedParams.id])

  const handleEdit = () => {
    router.push(`/dashboard/guests/${resolvedParams.id}/edit`)
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this guest?')) {
      setIsDeleting(true)
      try {
        await deleteGuest(resolvedParams.id)
        router.push('/dashboard/guests')
      } catch (error) {
        console.error('Failed to delete guest:', error)
        setIsDeleting(false)
      }
    }
  }

  const handleViewReservation = (reservationId: string) => {
    router.push(`/dashboard/reservations/${reservationId}`)
  }

  if (loading && !selectedGuest) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!selectedGuest) {
    return (
      <EmptyState
        icon={<UserCheck className="h-12 w-12 text-muted-foreground" />}
        title="Guest not found"
        description="The guest you're looking for doesn't exist or has been deleted."
        action={
          <Button onClick={() => router.push('/dashboard/guests')}>
            Back to Guests
          </Button>
        }
      />
    )
  }

  const totalRevenue = selectedGuest.totalRevenue || 0
  const totalReservations = selectedGuest.totalReservations || 0
  const averageStay = selectedGuest.reservations
    ? selectedGuest.reservations.reduce((acc, r) => {
        const checkIn = new Date(r.check_in)
        const checkOut = new Date(r.check_out)
        const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        return acc + days
      }, 0) / (selectedGuest.reservations.length || 1)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/guests')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {selectedGuest.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Guest since {format(new Date(selectedGuest.createdAt), 'MMMM yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReservations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Stay</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageStay.toFixed(1)} nights</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{totalReservations > 0 ? (totalRevenue / totalReservations).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Information */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedGuest.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a 
                    href={`mailto:${selectedGuest.email}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {selectedGuest.email}
                  </a>
                </div>
              </div>
            )}

            {selectedGuest.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <a 
                    href={`tel:${selectedGuest.phone}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {selectedGuest.phone}
                  </a>
                </div>
              </div>
            )}

            {selectedGuest.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <div className="text-sm text-muted-foreground">
                    {selectedGuest.address.street && <p>{selectedGuest.address.street}</p>}
                    {(selectedGuest.address.city || selectedGuest.address.state || selectedGuest.address.zipCode) && (
                      <p>
                        {selectedGuest.address.city}
                        {selectedGuest.address.city && selectedGuest.address.state && ', '}
                        {selectedGuest.address.state} {selectedGuest.address.zipCode}
                      </p>
                    )}
                    {selectedGuest.address.country && <p>{selectedGuest.address.country}</p>}
                  </div>
                </div>
              </div>
            )}

            {!selectedGuest.email && !selectedGuest.phone && !selectedGuest.address && (
              <p className="text-sm text-muted-foreground">No contact information available</p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedGuest.notes ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selectedGuest.notes}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No notes available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reservation History */}
      <Card>
        <CardHeader>
          <CardTitle>Reservation History</CardTitle>
          <CardDescription>
            All bookings from this guest
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedGuest.reservations && selectedGuest.reservations.length > 0 ? (
            <div className="space-y-4">
              {selectedGuest.reservations.map((reservation: any) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleViewReservation(reservation.id)}
                >
                  <div className="flex items-center gap-4">
                    <Home className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {reservation.apartments?.name || 'Unknown Apartment'}
                        {reservation.apartments?.unit_number && ` - Unit ${reservation.apartments.unit_number}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {reservation.platform}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(reservation.check_in), 'MMM d')} - {format(new Date(reservation.check_out), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      €{reservation.total_price?.toFixed(2) || '0.00'}
                    </p>
                    <Badge 
                      variant={
                        reservation.status === 'confirmed' ? 'default' :
                        reservation.status === 'cancelled' ? 'destructive' :
                        reservation.status === 'completed' ? 'secondary' :
                        'outline'
                      }
                      className="text-xs mt-1"
                    >
                      {reservation.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Calendar className="h-8 w-8 text-muted-foreground" />}
              title="No reservations"
              description="This guest hasn't made any bookings yet"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}