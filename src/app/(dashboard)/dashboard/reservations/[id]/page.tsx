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
  AlertCircle,
  Save,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedData, setEditedData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  
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
    setIsEditMode(true)
    setEditedData({
      checkIn: selectedReservation?.checkIn,
      checkOut: selectedReservation?.checkOut,
      guestCount: selectedReservation?.guestCount,
      totalPrice: selectedReservation?.totalPrice,
      cleaningFee: selectedReservation?.cleaningFee || 0,
      platformFee: selectedReservation?.platformFee || 0,
      platform: selectedReservation?.platform,
      notes: selectedReservation?.notes || '',
      contactInfo: selectedReservation?.contactInfo || {},
      status: selectedReservation?.status,
      guestName: selectedReservation?.guest?.name || ''
    })
  }

  const handleSave = async () => {
    if (!selectedReservation || !editedData) return
    
    try {
      setIsSaving(true)
      await updateReservation(selectedReservation.id, editedData)
      await fetchReservation(resolvedParams.id)
      setIsEditMode(false)
      setEditedData(null)
    } catch (error) {
      console.error('Failed to save changes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditMode(false)
    setEditedData(null)
  }

  const updateField = (field: string, value: any) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }))
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

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getDuration = () => {
    if (!selectedReservation) return 0
    const checkIn = new Date(selectedReservation.checkIn)
    const checkOut = new Date(selectedReservation.checkOut)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getStatusActions = () => {
    if (!selectedReservation) return []
    
    const { status } = selectedReservation
    
    // Système simplifié: on peut seulement basculer entre confirmed et cancelled
    if (status === 'confirmed') {
      return [
        { label: 'Annuler la réservation', action: () => handleStatusUpdate('cancelled'), variant: 'destructive' as const }
      ]
    } else if (status === 'cancelled') {
      return [
        { label: 'Réactiver la réservation', action: () => handleStatusUpdate('confirmed'), variant: 'default' as const }
      ]
    }
    
    return []
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
              {selectedReservation.guest?.name || 
               (selectedReservation.contactInfo as any)?.name || 
               'Guest'} Reservation
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
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={editedData?.checkIn || ''}
                      onChange={(e) => updateField('checkIn', e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-muted-foreground">{formatDate(selectedReservation.checkIn)}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Check-out
                  </h4>
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={editedData?.checkOut || ''}
                      onChange={(e) => updateField('checkOut', e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-muted-foreground">{formatDate(selectedReservation.checkOut)}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {isEditMode ? (
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={editedData?.guestCount || 1}
                      onChange={(e) => updateField('guestCount', parseInt(e.target.value) || 1)}
                      className="w-20 h-8"
                    />
                  ) : (
                    <span>{selectedReservation.guestCount} guests</span>
                  )}
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
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Guest Information
                </span>
                {selectedReservation.guest?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/guests/${selectedReservation.guest.id}`)}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Guest Profile
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Primary Guest</h4>
                {isEditMode ? (
                  <Input
                    type="text"
                    value={editedData?.guestName || ''}
                    onChange={(e) => updateField('guestName', e.target.value)}
                    placeholder="Enter guest name"
                    className="w-full"
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {selectedReservation.guest?.name || 
                     (selectedReservation.contactInfo as any)?.name || 
                     'No guest information'}
                  </p>
                )}
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

              {selectedReservation.contactInfo && (
                <div>
                  <h4 className="font-semibold mb-2">Additional Contact Info</h4>
                  <div className="space-y-2 text-sm">
                    {typeof selectedReservation.contactInfo === 'object' ? (
                      Object.entries(selectedReservation.contactInfo).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                          </span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">{String(selectedReservation.contactInfo)}</p>
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
                {isEditMode ? (
                  <Select
                    value={editedData?.platform || selectedReservation.platform}
                    onValueChange={(value) => updateField('platform', value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                      <SelectItem value="vrbo">VRBO</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="booking_com">Booking.com</SelectItem>
                      <SelectItem value="rent">Loyer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <PlatformBadge platform={selectedReservation.platform} />
                )}
              </div>
              
              {selectedReservation.platformReservationId && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Platform Reservation ID:</span>
                  <code className="px-2 py-1 bg-muted rounded text-sm">
                    {selectedReservation.platformReservationId}
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
              {isEditMode ? (
                <>
                  <Button
                    onClick={handleSave}
                    className="w-full gap-2"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <LoadingSpinner className="h-4 w-4" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="w-full gap-2"
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
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
                {isEditMode ? (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editedData?.totalPrice || 0}
                    onChange={(e) => updateField('totalPrice', parseFloat(e.target.value) || 0)}
                    className="w-32 text-right"
                  />
                ) : (
                  <span className="font-semibold">
                    {formatCurrency(selectedReservation.totalPrice, selectedReservation.currency)}
                  </span>
                )}
              </div>
              
              {selectedReservation.cleaningFee && selectedReservation.cleaningFee > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Cleaning Fee:</span>
                  <span>
                    {formatCurrency(selectedReservation.cleaningFee, selectedReservation.currency)}
                  </span>
                </div>
              )}
              
              {selectedReservation.platformFee && selectedReservation.platformFee > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Platform Fee:</span>
                  <span>
                    {formatCurrency(selectedReservation.platformFee, selectedReservation.currency)}
                  </span>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Per Night:</span>
                  <span>
                    {formatCurrency(selectedReservation.totalPrice / getDuration(), selectedReservation.currency)}
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
                  Created: {new Date(selectedReservation.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {selectedReservation.updatedAt !== selectedReservation.createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-muted-foreground">
                    Updated: {new Date(selectedReservation.updatedAt).toLocaleDateString()}
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