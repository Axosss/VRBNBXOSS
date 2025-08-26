'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Phone, 
  Mail, 
  MessageCircle,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { ReservationStatusBadge } from '@/components/reservations/reservation-status-badge'
import { PlatformBadge } from '@/components/reservations/platform-badge'
import { useReservationStore } from '@/lib/stores/reservation-store'

interface ReservationDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ReservationDetailPage({ params }: ReservationDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasTriedToLoad, setHasTriedToLoad] = useState(false)
  
  const { 
    selectedReservation, 
    isLoading, 
    error, 
    fetchReservation, 
    deleteReservation,
    updateReservation,
    clearError 
  } = useReservationStore()

  useEffect(() => {
    if (resolvedParams.id) {
      setHasTriedToLoad(true)
      fetchReservation(resolvedParams.id)
    }
  }, [resolvedParams.id, fetchReservation])

  const handleEdit = () => {
    router.push(`/dashboard/reservations/${resolvedParams.id}/edit`)
  }

  const handleDelete = async () => {
    if (!selectedReservation) return
    
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the reservation for ${selectedReservation.guest?.name || 'this guest'}? This action cannot be undone.`
    )
    
    if (confirmed) {
      try {
        setIsDeleting(true)
        await deleteReservation(selectedReservation.id)
        router.push('/dashboard/reservations')
      } catch (error) {
        console.error('Failed to delete reservation:', error)
        setIsDeleting(false)
      }
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedReservation) return
    
    try {
      await updateReservation(selectedReservation.id, { 
        status: newStatus as any 
      })
      // Refetch to get updated data
      fetchReservation(resolvedParams.id)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getDuration = () => {
    if (!selectedReservation) return 0
    const checkIn = new Date(selectedReservation.check_in)
    const checkOut = new Date(selectedReservation.check_out)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getStatusActions = () => {
    if (!selectedReservation) return []
    
    const { status } = selectedReservation
    
    switch (status) {
      case 'draft':
        return [
          { label: 'Confirm Reservation', action: () => handleStatusUpdate('confirmed'), variant: 'default' as const }
        ]
      case 'pending':
        return [
          { label: 'Confirm', action: () => handleStatusUpdate('confirmed'), variant: 'default' as const },
          { label: 'Cancel', action: () => handleStatusUpdate('cancelled'), variant: 'destructive' as const }
        ]
      case 'confirmed':
        return [
          { label: 'Check In', action: () => handleStatusUpdate('checked_in'), variant: 'default' as const }
        ]
      case 'checked_in':
        return [
          { label: 'Check Out', action: () => handleStatusUpdate('checked_out'), variant: 'default' as const }
        ]
      case 'checked_out':
        return [
          { label: 'Archive', action: () => handleStatusUpdate('archived'), variant: 'outline' as const }
        ]
      default:
        return []
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold text-destructive">Error Loading Reservation</h3>
          </div>
          <p className="text-destructive mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => {
              clearError()
              fetchReservation(resolvedParams.id)
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // If still loading or haven't tried to load yet, show loading state
  if (isLoading || !hasTriedToLoad) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If we have tried to load but don't have a reservation and no error, show not found
  if (hasTriedToLoad && !selectedReservation && !error) {
    notFound()
  }

  // If we have an error, the error UI above will handle it
  // If we have a reservation, continue with the normal rendering
  if (!selectedReservation) {
    return null // This should not happen but prevents crashes
  }

  const statusActions = getStatusActions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedReservation.guest?.name || 'Guest'} Reservation
            </h1>
            <p className="text-muted-foreground">
              Reservation details and management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReservationStatusBadge status={selectedReservation.status} />
          <PlatformBadge platform={selectedReservation.platform} />
        </div>
      </div>

      {/* Status Actions */}
      {statusActions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Available Actions:</span>
              <div className="flex gap-2">
                {statusActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant}
                    size="sm"
                    onClick={action.action}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property & Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Property & Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Property</h4>
                <p className="text-muted-foreground">{selectedReservation.apartment?.name}</p>
                {selectedReservation.apartment?.address && (
                  <p className="text-sm text-muted-foreground">
                    {selectedReservation.apartment.address.street}, {selectedReservation.apartment.address.city}, {selectedReservation.apartment.address.state}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Check-in
                  </h4>
                  <p className="text-muted-foreground">{formatDate(selectedReservation.check_in)}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Check-out
                  </h4>
                  <p className="text-muted-foreground">{formatDate(selectedReservation.check_out)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedReservation.guest_count} guests</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{getDuration()} nights</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Primary Guest</h4>
                <p className="text-muted-foreground">{selectedReservation.guest?.name || 'No guest information'}</p>
              </div>
              
              {selectedReservation.guest && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedReservation.guest.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${selectedReservation.guest.email}`}
                        className="text-primary hover:underline"
                      >
                        {selectedReservation.guest.email}
                      </a>
                    </div>
                  )}
                  {selectedReservation.guest.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`tel:${selectedReservation.guest.phone}`}
                        className="text-primary hover:underline"
                      >
                        {selectedReservation.guest.phone}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {selectedReservation.contact_info && (
                <div>
                  <h4 className="font-semibold mb-2">Additional Contact Info</h4>
                  <div className="space-y-2 text-sm">
                    {typeof selectedReservation.contact_info === 'object' ? (
                      Object.entries(selectedReservation.contact_info).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                          </span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">{String(selectedReservation.contact_info)}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Platform Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Platform:</span>
                <PlatformBadge platform={selectedReservation.platform} />
              </div>
              
              {selectedReservation.platform_reservation_id && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Platform Reservation ID:</span>
                  <code className="px-2 py-1 bg-muted rounded text-sm">
                    {selectedReservation.platform_reservation_id}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {selectedReservation.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {selectedReservation.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleEdit}
                className="w-full gap-2"
                variant="outline"
              >
                <Edit className="h-4 w-4" />
                Edit Reservation
              </Button>
              
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white border-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 text-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 text-white" />
                    Delete Reservation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pricing Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Price:</span>
                <span className="font-semibold">
                  {formatCurrency(selectedReservation.total_price, selectedReservation.currency)}
                </span>
              </div>
              
              {selectedReservation.cleaning_fee > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Cleaning Fee:</span>
                  <span>
                    {formatCurrency(selectedReservation.cleaning_fee, selectedReservation.currency)}
                  </span>
                </div>
              )}
              
              {selectedReservation.platform_fee > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Platform Fee:</span>
                  <span>
                    {formatCurrency(selectedReservation.platform_fee, selectedReservation.currency)}
                  </span>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Per Night:</span>
                  <span>
                    {formatCurrency(selectedReservation.total_price / getDuration(), selectedReservation.currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                <span className="text-muted-foreground">
                  Created: {new Date(selectedReservation.created_at).toLocaleDateString()}
                </span>
              </div>
              
              {selectedReservation.updated_at !== selectedReservation.created_at && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-muted-foreground">
                    Updated: {new Date(selectedReservation.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-muted-foreground">
                  Status: {selectedReservation.status.replace('_', ' ').charAt(0).toUpperCase() + selectedReservation.status.slice(1).replace('_', ' ')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}