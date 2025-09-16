'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Star, 
  DollarSign, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Package,
  TrendingUp,
  Award,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { CleaningCard } from '@/components/cleaning/cleaning-card'
import { useCleaningStore } from '@/lib/stores/cleaning-store'
import { cn } from '@/lib/utils'

interface CleanerDetailsPageProps {
  params: Promise<{ id: string }>
}

export default function CleanerDetailsPage({ params }: CleanerDetailsPageProps) {
  const router = useRouter()
  const { id: cleanerId } = use(params)
  const { 
    selectedCleaner, 
    cleanings,
    isLoading, 
    error,
    fetchCleaner,
    fetchCleanings
  } = useCleaningStore()

  const [cleanerCleanings, setCleanerCleanings] = useState<any[]>([])

  useEffect(() => {
    if (cleanerId) {
      fetchCleaner(cleanerId)
      fetchCleanings({ cleanerId: cleanerId, limit: 50 })
    }
  }, [cleanerId, fetchCleaner, fetchCleanings])

  useEffect(() => {
    // Filter cleanings for this cleaner
    const filtered = cleanings.filter(cleaning => cleaning.cleaner_id === cleanerId)
    setCleanerCleanings(filtered)
  }, [cleanings, cleanerId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    notFound()
  }

  if (!selectedCleaner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  const cleaner = selectedCleaner

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return null
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR' // Always force EUR display
    }).format(amount)
  }

  const getRateDisplay = () => {
    if (cleaner.rate) {
      return `${formatCurrency(cleaner.rate, 'EUR')}/hr`
    }
    return 'Rate not set'
  }

  // Calculate stats
  const stats = {
    totalJobs: cleanerCleanings.length,
    completedJobs: cleanerCleanings.filter(c => c.status === 'completed' || c.status === 'verified').length,
    pendingJobs: cleanerCleanings.filter(c => c.status === 'scheduled' || c.status === 'in_progress').length,
    averageRating: 0,
    totalRevenue: cleanerCleanings
      .filter(c => c.status === 'completed' || c.status === 'verified')
      .reduce((sum, c) => sum + (c.cost || 0), 0),
    completionRate: cleanerCleanings.length > 0 
      ? Math.round((cleanerCleanings.filter(c => c.status === 'completed' || c.status === 'verified').length / cleanerCleanings.length) * 100)
      : 0
  }

  const recentCleanings = cleanerCleanings
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

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
          <h1 className="text-2xl font-bold">Cleaner Details</h1>
          <p className="text-muted-foreground">
            View cleaner information and performance
          </p>
        </div>
        <Button 
          onClick={() => router.push(`/dashboard/cleaners/${cleaner.id}/edit`)}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Cleaner Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Profile Information */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                  {getInitials(cleaner.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{cleaner.name}</h2>
                  <Badge 
                    variant="default"
                    className="bg-green-100 text-green-800 hover:bg-green-200"
                  >
                    Active
                  </Badge>
                </div>
                
                {false && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-4 w-4",
                            star <= cleaner.rating! ? "text-amber-400 fill-current" : "text-gray-200"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {cleaner.rating.toFixed(1)} rating
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-sm font-medium">
                  <DollarSign className="h-4 w-4" />
                  <span>{getRateDisplay()}</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {cleaner.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${cleaner.email}`}
                    className="text-blue-600 hover:underline truncate"
                  >
                    {cleaner.email}
                  </a>
                </div>
              )}
              
              {cleaner.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${cleaner.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {cleaner.phone}
                  </a>
                </div>
              )}

              {cleaner.supplies_included && (
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-green-600 font-medium">Supplies included</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {new Date(cleaner.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Services */}
          {cleaner.services && cleaner.services.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-3">Services Offered</h3>
              <div className="flex flex-wrap gap-2">
                {cleaner.services.map((service, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="bg-slate-50 text-slate-700"
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {cleaner.notes && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{cleaner.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedJobs} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Jobs completed successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on completed jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue, cleaner.currency || 'EUR')}
            </div>
            <p className="text-xs text-muted-foreground">
              From completed jobs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      {stats.pendingJobs > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Workload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">
                  {stats.pendingJobs} pending job{stats.pendingJobs !== 1 ? 's' : ''}
                </span>
              </div>
              {stats.pendingJobs > 5 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  High workload
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Cleanings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Recent Cleanings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentCleanings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No cleanings assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCleanings.map(cleaning => (
                <CleaningCard
                  key={cleaning.id}
                  cleaning={cleaning}
                  onClick={(cleaning) => router.push(`/dashboard/cleaning/${cleaning.id}`)}
                  compact={true}
                  showActions={false}
                />
              ))}
              
              {cleanerCleanings.length > 5 && (
                <div className="text-center pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/dashboard/cleaning?cleaner=${cleaner.id}`)}
                  >
                    View All Cleanings ({cleanerCleanings.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}