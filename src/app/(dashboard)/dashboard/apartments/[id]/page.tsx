'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
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
  Eye,
  EyeOff,
  Copy,
  Check,
  Settings,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApartmentStore } from '@/lib/stores/apartment-store'
import { PhotoManager } from '@/components/apartments/photo-manager'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { cn } from '@/lib/utils'

export default function ApartmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const apartmentId = params.id as string
  
  const { 
    selectedApartment,
    fetchApartment,
    deleteApartment,
    isLoading,
    isDeleting,
    error,
  } = useApartmentStore()

  const [showAccessCodes, setShowAccessCodes] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (apartmentId) {
      fetchApartment(apartmentId)
    }
  }, [apartmentId, fetchApartment])

  const handleEdit = () => {
    router.push(`/dashboard/apartments/${apartmentId}/edit`)
  }

  const handleDelete = async () => {
    try {
      await deleteApartment(apartmentId)
      router.push('/dashboard/apartments')
    } catch (error) {
      console.error('Failed to delete apartment:', error)
    }
  }

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(type)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const getAmenityIcon = (amenityId: string) => {
    const icons: Record<string, any> = {
      'WiFi': Wifi,
      'Parking': Car,
      'Kitchen': Coffee,
      'TV': Tv,
      'AC': Snowflake,
      'Pool': Waves,
      'Gym': Dumbbell,
      'Security': Shield,
    }
    return icons[amenityId] || Settings
  }

  const statusColors = {
    active: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    maintenance: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
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
            onClick={() => router.push('/dashboard/apartments')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Properties
          </Button>
        </div>
        
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  if (!selectedApartment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/apartments')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Properties
          </Button>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">Property not found</p>
        </div>
      </div>
    )
  }

  const apartment = selectedApartment
  const statusColor = statusColors[apartment.status]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/apartments')}
            className="gap-2 mt-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{apartment.name}</h1>
              <div className={cn(
                'px-2 py-1 rounded-full text-xs border font-medium',
                statusColor.bg,
                statusColor.text,
                statusColor.border
              )}>
                {apartment.status.charAt(0).toUpperCase() + apartment.status.slice(1)}
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {apartment.address.street}, {apartment.address.city}, {apartment.address.state} {apartment.address.zipCode}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteConfirm(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="font-semibold">{apartment.capacity} guests</p>
                  </div>
                </div>
                
                {apartment.bedrooms && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                      <p className="font-semibold">{apartment.bedrooms}</p>
                    </div>
                  </div>
                )}
                
                {apartment.bathrooms && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                      <p className="font-semibold">{apartment.bathrooms}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize">{apartment.status}</p>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {apartment.amenities.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Amenities</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {apartment.amenities.map((amenity) => {
                      const Icon = getAmenityIcon(amenity)
                      return (
                        <div key={amenity} className="flex items-center gap-2 text-sm">
                          <Icon className="h-4 w-4 text-primary" />
                          <span>{amenity}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoManager apartment={apartment} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Photos</p>
                <p className="text-2xl font-bold">{apartment.photos.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {new Date(apartment.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">
                  {new Date(apartment.updated_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Access Codes */}
          {apartment.accessCodes && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Access Codes</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAccessCodes(!showAccessCodes)}
                >
                  {showAccessCodes ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* WiFi */}
                {apartment.accessCodes.wifi && (
                  <div>
                    <p className="text-sm font-medium mb-2">WiFi</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Network:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-mono">
                            {apartment.accessCodes.wifi.network}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(apartment.accessCodes!.wifi!.network, 'wifi-network')}
                          >
                            {copiedCode === 'wifi-network' ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Password:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-mono">
                            {showAccessCodes ? apartment.accessCodes.wifi.password : '••••••••'}
                          </span>
                          {showAccessCodes && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyToClipboard(apartment.accessCodes!.wifi!.password, 'wifi-password')}
                            >
                              {copiedCode === 'wifi-password' ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Door Code */}
                {apartment.accessCodes.door && (
                  <div>
                    <p className="text-sm font-medium mb-1">Door Code</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono">
                        {showAccessCodes ? apartment.accessCodes.door : '••••••'}
                      </span>
                      {showAccessCodes && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(apartment.accessCodes!.door!, 'door')}
                        >
                          {copiedCode === 'door' ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Mailbox Code */}
                {apartment.accessCodes.mailbox && (
                  <div>
                    <p className="text-sm font-medium mb-1">Mailbox Code</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono">
                        {showAccessCodes ? apartment.accessCodes.mailbox : '••••••'}
                      </span>
                      {showAccessCodes && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(apartment.accessCodes!.mailbox!, 'mailbox')}
                        >
                          {copiedCode === 'mailbox' ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Codes */}
                {apartment.accessCodes.additional && Object.keys(apartment.accessCodes.additional).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Additional</p>
                    <div className="space-y-2">
                      {Object.entries(apartment.accessCodes.additional).map(([name, code]) => (
                        <div key={name} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{name}:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-mono">
                              {showAccessCodes ? code : '••••••'}
                            </span>
                            {showAccessCodes && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyToClipboard(code, `additional-${name}`)}
                              >
                                {copiedCode === `additional-${name}` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full gap-2" disabled>
                <Calendar className="h-4 w-4" />
                View Calendar
                <span className="text-xs text-muted-foreground ml-auto">Coming Soon</span>
              </Button>
              <Button variant="outline" className="w-full gap-2" disabled>
                <Settings className="h-4 w-4" />
                Manage Bookings
                <span className="text-xs text-muted-foreground ml-auto">Coming Soon</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle>Delete Property</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-6">
                Are you sure you want to delete <strong>{apartment.name}</strong>? 
                This will permanently remove the property and all associated data.
              </p>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Property'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}