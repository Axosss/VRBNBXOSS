'use client'

import { CalendarStats as CalendarStatsType } from '@/types/calendar'
import { Card } from '@/components/ui/card'
import { formatCurrency } from './calendar-utils'
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  BarChart3,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarStatsProps {
  stats: CalendarStatsType
  dateRange: { start: string; end: string }
  className?: string
}

export function CalendarStats({ 
  stats, 
  dateRange, 
  className 
}: CalendarStatsProps) {
  const occupancyPercentage = Math.round(stats.occupancy_rate * 100)
  const averageRevenue = stats.total_reservations > 0 
    ? stats.total_revenue / stats.total_reservations 
    : 0

  // Get platform breakdown data
  const platformData = Object.entries(stats.platform_breakdown || {}).map(([platform, count]) => ({
    platform,
    count: Number(count),
    percentage: stats.total_reservations > 0 ? (Number(count) / stats.total_reservations) * 100 : 0
  })).sort((a, b) => b.count - a.count)

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'airbnb':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'vrbo':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'direct':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'booking_com':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'airbnb':
        return 'Airbnb'
      case 'vrbo':
        return 'VRBO'
      case 'direct':
        return 'Direct'
      case 'booking_com':
        return 'Booking.com'
      default:
        return platform
    }
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupancy Rate */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Occupancy Rate</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {occupancyPercentage}%
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.occupied_nights} of {stats.total_nights} nights
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">Total Revenue</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.total_revenue)}
            </div>
            <div className="text-xs text-muted-foreground">
              Avg: {formatCurrency(averageRevenue)} per booking
            </div>
          </div>
        </div>

        {/* Total Reservations */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Reservations</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {stats.total_reservations}
            </div>
            <div className="text-xs text-muted-foreground">
              Total bookings
            </div>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-muted-foreground">Platforms</span>
          </div>
          <div className="space-y-2">
            {platformData.length > 0 ? (
              platformData.slice(0, 3).map(({ platform, count, percentage }) => (
                <div key={platform} className="flex items-center justify-between">
                  <div className={cn(
                    'text-xs px-2 py-1 rounded border font-medium',
                    getPlatformColor(platform)
                  )}>
                    {getPlatformLabel(platform)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {count} ({Math.round(percentage)}%)
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground">
                No platform data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional insights for larger screens */}
      {platformData.length > 3 && (
        <div className="hidden lg:block mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Platform Distribution
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {platformData.map(({ platform, count, percentage }) => (
              <div
                key={platform}
                className={cn(
                  'p-3 rounded-lg border text-center',
                  getPlatformColor(platform)
                )}
              >
                <div className="font-semibold text-lg">{count}</div>
                <div className="text-xs opacity-75">
                  {getPlatformLabel(platform)}
                </div>
                <div className="text-xs opacity-60">
                  {Math.round(percentage)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Period indicator */}
      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
        Statistics for period: {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
      </div>
    </Card>
  )
}