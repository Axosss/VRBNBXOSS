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
  XCircle,
  AlertCircle,
  Trash2,
  UserPlus,
  FileText,
  Camera
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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

// Missing AlertDialog component - let me create a simple version
function AlertDialogTemp({ children }: { children: React.ReactNode }) {
  return <>{children}</>
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
    cancelCleaning
  } = useCleaningStore()

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (cleaningId) {
      fetchCleaning(cleaningId)
    }
  }, [cleaningId, fetchCleaning])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || !selectedCleaning) {
    notFound()
  }

  const cleaning = selectedCleaning

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
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
    try {
      await cancelCleaning(cleaning.id)
      router.push('/dashboard/cleaning')
    } catch (error) {
      console.error('Failed to delete cleaning:', error)
    }
  }

  const getStatusActions = (currentStatus: CleaningStatus) => {
    switch (currentStatus) {
      case 'needed':
        return [
          { 
            label: 'Mark Scheduled', 
            status: 'scheduled' as CleaningStatus, 
            icon: Calendar, 
            variant: 'default' as const 
          },
        ]
      case 'scheduled':
        return [
          { 
            label: 'Start Cleaning', 
            status: 'in_progress' as CleaningStatus, 
            icon: PlayCircle, 
            variant: 'default' as const 
          },
        ]
      case 'in_progress':
        return [
          { 
            label: 'Mark Completed', 
            status: 'completed' as CleaningStatus, 
            icon: CheckCircle2, 
            variant: 'default' as const 
          },
        ]
      case 'completed':
        return [
          { 
            label: 'Verify Quality', 
            status: 'verified' as CleaningStatus, 
            icon: CheckCircle2, 
            variant: 'default' as const 
          },
        ]
      default:
        return []
    }
  }

  const statusActions = getStatusActions(cleaning.status)
  const scheduledStart = formatDateTime(cleaning.scheduled_start)
  const scheduledEnd = formatDateTime(cleaning.scheduled_end)
  const actualStart = cleaning.actual_start ? formatDateTime(cleaning.actual_start) : null
  const actualEnd = cleaning.actual_end ? formatDateTime(cleaning.actual_end) : null

  const isOverdue = (cleaning.status === 'needed' || cleaning.status === 'scheduled') && 
    new Date(cleaning.scheduled_start) < new Date()

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
            {cleaning.cleaning_type.charAt(0).toUpperCase() + cleaning.cleaning_type.slice(1)} Cleaning
          </h1>
          <p className="text-muted-foreground">
            {cleaning.apartment?.name} • {scheduledStart.date}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
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

          {cleaning.status !== 'cancelled' && cleaning.status !== 'verified' && (
            <div className="flex gap-2">
              {statusActions.map((action) => (
                <Button
                  key={action.status}
                  variant={action.variant}
                  size="sm"
                  onClick={() => handleStatusChange(action.status)}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  {isUpdating ? (
                    <LoadingSpinner className="h-4 w-4" />
                  ) : (
                    <action.icon className="h-4 w-4" />
                  )}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Alert */}
      {isOverdue && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">This cleaning is overdue and needs immediate attention</span>
            </div>
          </CardContent>
        </Card>
      )}

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

          {/* Danger Zone */}
          {cleaning.status !== 'cancelled' && cleaning.status !== 'verified' && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this cleaning? This action cannot be undone.')) {
                      handleDeleteCleaning()
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel Cleaning
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}