'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  DollarSign, 
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Cleaner } from '@/types/cleaning'

interface CleanerCardProps {
  cleaner: Cleaner
  onEdit?: (cleaner: Cleaner) => void
  onDelete?: (id: string) => void
  onToggleActive?: (id: string, active: boolean) => void
  onClick?: (cleaner: Cleaner) => void
  className?: string
  showActions?: boolean
}

export function CleanerCard({ 
  cleaner, 
  onEdit, 
  onDelete, 
  onToggleActive,
  onClick,
  className,
  showActions = true
}: CleanerCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const initials = cleaner.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleToggleActive = async (active: boolean) => {
    if (!onToggleActive) return
    
    setIsLoading(true)
    try {
      await onToggleActive(cleaner.id, active)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const rateDisplay = () => {
    if (cleaner.hourly_rate) {
      return `${formatCurrency(cleaner.hourly_rate, cleaner.currency)}/hr`
    }
    if (cleaner.flat_rate) {
      return `${formatCurrency(cleaner.flat_rate, cleaner.currency)} flat`
    }
    return 'Rate not set'
  }

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        !cleaner.active && "opacity-75 bg-muted/30",
        onClick && "cursor-pointer hover:shadow-lg",
        className
      )}
      onClick={onClick ? () => onClick(cleaner) : undefined}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold mb-1">
                {cleaner.name}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant={cleaner.active ? 'default' : 'secondary'}
                  className={cn(
                    "text-xs",
                    cleaner.active 
                      ? "bg-green-100 text-green-800 hover:bg-green-200" 
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {cleaner.active ? 'Active' : 'Inactive'}
                </Badge>
                {cleaner.rating && (
                  <div className="flex items-center gap-1 text-sm text-amber-600">
                    <Star className="h-4 w-4 fill-current" />
                    <span>{cleaner.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  disabled={isLoading}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onEdit && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(cleaner)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                )}
                {onToggleActive && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleActive(!cleaner.active)
                    }}
                    disabled={isLoading}
                  >
                    {cleaner.active ? (
                      <>
                        <UserX className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(cleaner.id)
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          {cleaner.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{cleaner.email}</span>
            </div>
          )}
          {cleaner.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{cleaner.phone}</span>
            </div>
          )}
        </div>

        {/* Services */}
        {cleaner.services && cleaner.services.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Services</h4>
            <div className="flex flex-wrap gap-1">
              {cleaner.services.slice(0, 3).map((service, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs bg-slate-50 text-slate-700"
                >
                  {service}
                </Badge>
              ))}
              {cleaner.services.length > 3 && (
                <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">
                  +{cleaner.services.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Stats and Pricing */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{cleaner.total_cleanings} jobs</span>
            </div>
            {cleaner.supplies_included && (
              <Badge variant="outline" className="text-xs">
                Supplies included
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm font-medium">
            <DollarSign className="h-4 w-4" />
            <span>{rateDisplay()}</span>
          </div>
        </div>

        {/* Notes */}
        {cleaner.notes && (
          <div className="text-sm text-muted-foreground">
            <p className="line-clamp-2">{cleaner.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}