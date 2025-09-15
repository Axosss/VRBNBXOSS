'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Clock,
  MapPin,
  User,
  DollarSign,
  Star,
  CheckCircle2,
  PlayCircle,
  AlertCircle,
  Trash2,
  UserPlus,
  FileText,
  Camera,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { CleaningStatusBadge } from '@/components/cleaning/cleaning-status-badge'
import { CleaningForm } from '@/components/cleaning/cleaning-form'
import { CleanerSelector } from '@/components/cleaning/cleaner-selector'
import { useCleaningStore } from '@/lib/stores/cleaning-store'
import { cn } from '@/lib/utils'
import type { CleaningStatus, UpdateCleaningData } from '@/types/cleaning'

interface CleaningDetailsPageProps {
  params: Promise<{ id: string }>
}

export default function CleaningDetailsPage({ params }: CleaningDetailsPageProps) {
  const router = useRouter()
  const { id: cleaningId } = use(params)
  const { 
    selectedCleaning, 
    isLoading, 
    error,
    fetchCleaning,
    updateCleaning,
    cancelCleaning,
    deleteCleaning
  } = useCleaningStore()

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const [hasFetched, setHasFetched] = useState(false)
  
  useEffect(() => {
    if (cleaningId && !hasFetched) {
      console.log('Fetching cleaning with ID:', cleaningId)
      setHasFetched(true)
      fetchCleaning(cleaningId).then(() => {
        console.log('Cleaning fetched successfully')
      }).catch(err => {
        console.error('Error fetching cleaning:', err)
      })
    }
  }, [cleaningId, fetchCleaning, hasFetched])

  // Debug logging
  console.log('Component state:', { 
    cleaningId, 
    isLoading, 
    error, 
    selectedCleaning,
    hasSelectedCleaning: !!selectedCleaning 
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    console.error('Cleaning details error:', error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Error Loading Cleaning</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/dashboard/cleaning')}>
          Back to Cleanings
        </Button>
      </div>
    )
  }

  // Only show 404 if we've tried to fetch and still no data
  if (!selectedCleaning && hasFetched && !isLoading && !error) {
    notFound()
  }
  
  // If we're still waiting for data, show loading
  if (!selectedCleaning) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  const cleaning = selectedCleaning

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) {
      return {
        date: 'Date not set',
        time: 'Time not set'
      }
    }
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return {
        date: 'Invalid date',
        time: 'Invalid time'
      }
    }
    
    return {
      date: date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getCleanerInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleStatusChange = async (newStatus: CleaningStatus) => {
    setIsUpdating(true)
    try {
      const updateData: UpdateCleaningData = { status: newStatus }
      
      // Set actual times for status changes
      if (newStatus === 'in_progress' && !cleaning.actual_start) {
        updateData.actual_start = new Date().toISOString()
      } else if ((newStatus === 'completed' || newStatus === 'verified') && !cleaning.actual_end) {
        updateData.actual_end = new Date().toISOString()
        if (!cleaning.actual_start) {
          updateData.actual_start = cleaning.scheduled_start
        }
      }
      
      await updateCleaning(cleaning.id, updateData)
    } catch (error) {
      console.error('Failed to update cleaning status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAssignCleaner = async () => {
    if (!selectedCleanerId) return
    
    setIsUpdating(true)
    try {
      await updateCleaning(cleaning.id, { cleaner_id: selectedCleanerId })
      setShowAssignDialog(false)
      setSelectedCleanerId(null)
    } catch (error) {
      console.error('Failed to assign cleaner:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditCleaning = async (data: UpdateCleaningData) => {
    try {
      await updateCleaning(cleaning.id, data)
      setShowEditDialog(false)
    } catch (error) {
      console.error('Failed to update cleaning:', error)
    }
  }

  const handleDeleteCleaning = async () => {
    if (window.confirm('Are you sure you want to permanently delete this cleaning?')) {
      try {
        await deleteCleaning(cleaning.id)
        router.push('/dashboard/cleaning')
      } catch (error) {
        console.error('Failed to delete cleaning:', error)
        alert('Failed to delete cleaning: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    }
  }
  
  const handleCancelCleaning = async () => {
    if (window.confirm('Are you sure you want to cancel this cleaning?')) {
      try {
        await cancelCleaning(cleaning.id)
      } catch (error) {
        console.error('Failed to cancel cleaning:', error)
        alert('Failed to cancel cleaning: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    }
  }

  // Simplified - no status workflow actions
  const getStatusActions = (currentStatus: CleaningStatus) => {
    return [] // No status transitions - cleanings are purely informational
  }

  const statusActions = getStatusActions(cleaning.status)
  const scheduledStart = formatDateTime(cleaning.scheduledStart)
  const scheduledEnd = formatDateTime(cleaning.scheduledEnd)
  const actualStart = cleaning.actualStart ? formatDateTime(cleaning.actualStart) : null
  const actualEnd = cleaning.actualEnd ? formatDateTime(cleaning.actualEnd) : null

  const isOverdue = cleaning.status === 'scheduled' && 
    new Date(cleaning.scheduledStart) < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {cleaning.cleaningType.charAt(0).toUpperCase() + cleaning.cleaningType.slice(1)} Cleaning
          </h1>
          <p className="text-muted-foreground">
            {cleaning.apartment?.name} • {scheduledStart.date}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Temporarily adding Edit button without Dialog to test */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowEditDialog(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Cleaning</DialogTitle>
              </DialogHeader>
              <CleaningForm
                mode="edit"
                initialData={cleaning}
                onSubmit={handleEditCleaning}
                onCancel={() => setShowEditDialog(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Only show Delete button - no Cancel since we don't track status */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteCleaning}
            disabled={isUpdating}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>

          {/* Status workflow buttons removed - cleanings are purely informational */}
        </div>
      </div>

      {/* No status alerts - cleanings are purely informational */}

      {/* Main Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Cleaning Details</span>
                <CleaningStatusBadge status={cleaning.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Information */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Property
                </h3>
                {cleaning.apartment ? (
                  <div className="pl-6">
                    <p className="font-medium">{cleaning.apartment.name}</p>
                    {cleaning.apartment.address && (
                      <p className="text-sm text-muted-foreground">
                        {typeof cleaning.apartment.address === 'object' 
                          ? `${cleaning.apartment.address.street}, ${cleaning.apartment.address.city}`
                          : cleaning.apartment.address
                        }
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground pl-6">Property information not available</p>
                )}
              </div>

              {/* Schedule Information */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Scheduled Time
                </h3>
                <div className="pl-6 space-y-2">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{scheduledStart.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {scheduledStart.time} - {scheduledEnd.time}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actual Time (if available) */}
              {(actualStart || actualEnd) && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Actual Time
                  </h3>
                  <div className="pl-6">
                    {actualStart && actualEnd ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {actualStart.time} - {actualEnd.time}
                        </span>
                      </div>
                    ) : actualStart ? (
                      <div className="flex items-center gap-2 text-yellow-700">
                        <PlayCircle className="h-4 w-4" />
                        <span>Started at {actualStart.time}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {cleaning.instructions && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Special Instructions
                  </h3>
                  <div className="pl-6">
                    <p className="text-sm bg-muted/50 p-3 rounded">{cleaning.instructions}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {cleaning.notes && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Notes</h3>
                  <div className="pl-0">
                    <p className="text-sm">{cleaning.notes}</p>
                  </div>
                </div>
              )}

              {/* Rating */}
              {cleaning.rating && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Quality Rating
                  </h3>
                  <div className="pl-6">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-4 w-4",
                              star <= cleaning.rating! 
                                ? "text-amber-400 fill-current" 
                                : "text-gray-200"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {cleaning.rating} out of 5
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          {cleaning.photos && cleaning.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {cleaning.photos.map((photo, index) => (
                    <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img
                        src={photo}
                        alt={`Cleaning photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cleaner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned Cleaner
                </span>
                {!cleaning.cleaner_id && (
                  <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Cleaner</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <CleanerSelector
                          value={selectedCleanerId}
                          onValueChange={setSelectedCleanerId}
                          apartmentId={cleaning.apartment_id}
                          scheduledDate={cleaning.scheduled_start}
                          showAvailability={true}
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            onClick={() => setShowAssignDialog(false)}
                            disabled={isUpdating}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleAssignCleaner}
                            disabled={!selectedCleanerId || isUpdating}
                          >
                            {isUpdating ? (
                              <>
                                <LoadingSpinner className="h-4 w-4 mr-2" />
                                Assigning...
                              </>
                            ) : (
                              'Assign Cleaner'
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cleaning.cleaner ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getCleanerInitials(cleaning.cleaner.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{cleaning.cleaner.name}</p>
                      {cleaning.cleaner.rating && (
                        <div className="flex items-center gap-1 text-sm text-amber-600">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{cleaning.cleaner.rating.toFixed(1)} rating</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {cleaning.cleaner.email && (
                    <div className="text-sm text-muted-foreground">
                      <a href={`mailto:${cleaning.cleaner.email}`} className="hover:underline">
                        {cleaning.cleaner.email}
                      </a>
                    </div>
                  )}
                  
                  {cleaning.cleaner.phone && (
                    <div className="text-sm text-muted-foreground">
                      <a href={`tel:${cleaning.cleaner.phone}`} className="hover:underline">
                        {cleaning.cleaner.phone}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No cleaner assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Information */}
          {cleaning.cost && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(cleaning.cost, cleaning.currency)}
                </div>
                <p className="text-sm text-muted-foreground">
                  For this cleaning service
                </p>
              </CardContent>
            </Card>
          )}

          {/* Reservation Link */}
          {cleaning.reservation && (
            <Card>
              <CardHeader>
                <CardTitle>Related Reservation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">
                    {cleaning.reservation.guest_name || 'Guest checkout'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Checkout: {new Date(cleaning.reservation.check_out).toLocaleDateString()}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => router.push(`/dashboard/reservations/${cleaning.reservation?.id}`)}
                  >
                    View Reservation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Danger Zone removed - no Cancel button needed */}
        </div>
      </div>
    </div>
  )
}