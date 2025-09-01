'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, Users, DollarSign, Calendar, Home, BarChart3 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subMonths } from 'date-fns'

interface Statistics {
  occupancyRate: number
  totalGuests: number
  averageRevenue: number
  totalRevenue: number
  totalReservations: number
  monthlyData: Array<{
    month: string
    revenue: number
  }>
  platformBreakdown?: {
    airbnb: number
    vrbo: number
    direct: number
  }
}

interface Apartment {
  id: string
  name: string
}

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('3months')
  const [selectedApartment, setSelectedApartment] = useState<string>('all')

  // Fetch apartments for filter
  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const response = await fetch('/api/apartments')
        if (response.ok) {
          const data = await response.json()
          // The API returns an object with apartments array
          setApartments(data.data?.apartments || [])
        }
      } catch (error) {
        console.error('Failed to fetch apartments:', error)
      }
    }
    fetchApartments()
  }, [])

  // Fetch statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true)
      try {
        // Calculate date range
        const endDate = format(new Date(), 'yyyy-MM-dd')
        let startDate = format(subMonths(new Date(), 3), 'yyyy-MM-dd')
        
        if (dateRange === '1month') {
          startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd')
        } else if (dateRange === '6months') {
          startDate = format(subMonths(new Date(), 6), 'yyyy-MM-dd')
        } else if (dateRange === '1year') {
          startDate = format(subMonths(new Date(), 12), 'yyyy-MM-dd')
        }

        // Build query params
        const params = new URLSearchParams({
          startDate,
          endDate,
        })
        
        if (selectedApartment !== 'all') {
          params.append('apartmentId', selectedApartment)
        }

        const response = await fetch(`/api/statistics/simple?${params}`)
        if (response.ok) {
          const data = await response.json()
          setStatistics(data)
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [dateRange, selectedApartment])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color,
    subtitle 
  }: { 
    title: string
    value: string | number
    icon: any
    color: string
    subtitle?: string
  }) => (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-muted-foreground">Track your rental performance and key metrics</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last month</SelectItem>
            <SelectItem value="3months">Last 3 months</SelectItem>
            <SelectItem value="6months">Last 6 months</SelectItem>
            <SelectItem value="1year">Last year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedApartment} onValueChange={setSelectedApartment}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All properties</SelectItem>
            {apartments.map((apt) => (
              <SelectItem key={apt.id} value={apt.id}>
                {apt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Occupancy Rate"
          value={`${statistics?.occupancyRate || 0}%`}
          icon={TrendingUp}
          color="bg-blue-100 text-blue-600"
          subtitle="Percentage of nights booked"
        />
        <MetricCard
          title="Total Guests"
          value={statistics?.totalGuests || 0}
          icon={Users}
          color="bg-green-100 text-green-600"
          subtitle="People hosted"
        />
        <MetricCard
          title="Average Revenue"
          value={formatCurrency(statistics?.averageRevenue || 0)}
          icon={DollarSign}
          color="bg-purple-100 text-purple-600"
          subtitle="Per reservation"
        />
        <MetricCard
          title="Total Bookings"
          value={statistics?.totalReservations || 0}
          icon={Calendar}
          color="bg-orange-100 text-orange-600"
          subtitle="Confirmed reservations"
        />
      </div>

      {/* Platform Revenue Breakdown */}
      {statistics?.platformBreakdown && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Revenue by Platform</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Airbnb</span>
                  <span className="text-sm font-medium">
                    {((statistics.platformBreakdown.airbnb / statistics.totalRevenue) * 100 || 0).toFixed(0)}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#FF5A5F]">
                  {formatCurrency(statistics.platformBreakdown.airbnb)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#FF5A5F] h-2 rounded-full"
                    style={{
                      width: `${(statistics.platformBreakdown.airbnb / statistics.totalRevenue) * 100 || 0}%`
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">VRBO</span>
                  <span className="text-sm font-medium">
                    {((statistics.platformBreakdown.vrbo / statistics.totalRevenue) * 100 || 0).toFixed(0)}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#4A90E2]">
                  {formatCurrency(statistics.platformBreakdown.vrbo)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#4A90E2] h-2 rounded-full"
                    style={{
                      width: `${(statistics.platformBreakdown.vrbo / statistics.totalRevenue) * 100 || 0}%`
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Direct</span>
                  <span className="text-sm font-medium">
                    {((statistics.platformBreakdown.direct / statistics.totalRevenue) * 100 || 0).toFixed(0)}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#10B981]">
                  {formatCurrency(statistics.platformBreakdown.direct)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#10B981] h-2 rounded-full"
                    style={{
                      width: `${(statistics.platformBreakdown.direct / statistics.totalRevenue) * 100 || 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Revenue Chart */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Revenue Trend</h3>
            <div className="text-2xl font-bold">
              {formatCurrency(statistics?.totalRevenue || 0)}
              <span className="text-sm font-normal text-muted-foreground ml-2">total</span>
            </div>
          </div>
          
          {statistics?.monthlyData && statistics.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statistics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  angle={statistics.monthlyData.length > 15 ? -45 : 0}
                  textAnchor={statistics.monthlyData.length > 15 ? "end" : "middle"}
                  height={statistics.monthlyData.length > 15 ? 60 : 30}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: statistics.monthlyData.length > 20 ? 2 : 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center space-y-2">
                <Home className="h-12 w-12 mx-auto opacity-50" />
                <p>No revenue data available</p>
                <p className="text-sm">Start adding reservations to see trends</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}