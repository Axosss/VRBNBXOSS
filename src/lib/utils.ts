import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import bcrypt from "bcryptjs"
import { z } from "zod"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Error handling utilities
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export function createErrorResponse(error: unknown, defaultMessage: string = 'An error occurred') {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof z.ZodError) {
    // In Zod v4, error details are in the message as JSON string
    let message = 'Validation error'
    try {
      const errorData = JSON.parse(error.message)
      if (Array.isArray(errorData) && errorData.length > 0) {
        message = errorData[0].message || 'Validation error'
      }
    } catch {
      // If JSON parsing fails, use the raw message
      message = error.message
    }
    return {
      success: false,
      error: message,
      statusCode: 400,
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      statusCode: 500,
    }
  }

  return {
    success: false,
    error: defaultMessage,
    statusCode: 500,
  }
}

export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    ...(message && { message }),
  }
}

// Date utilities
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj)
}

export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = formatDate(startDate, { month: 'short', day: 'numeric' })
  const end = formatDate(endDate, { month: 'short', day: 'numeric', year: 'numeric' })
  
  return `${start} - ${end}`
}

export function getDaysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

export function isDateRangeOverlapping(
  range1Start: Date | string,
  range1End: Date | string,
  range2Start: Date | string,
  range2End: Date | string
): boolean {
  const r1Start = typeof range1Start === 'string' ? new Date(range1Start) : range1Start
  const r1End = typeof range1End === 'string' ? new Date(range1End) : range1End
  const r2Start = typeof range2Start === 'string' ? new Date(range2Start) : range2Start
  const r2End = typeof range2End === 'string' ? new Date(range2End) : range2End

  return r1Start < r2End && r2Start < r1End
}

// Currency utilities
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function calculateOccupancyRate(occupiedNights: number, totalNights: number): number {
  if (totalNights === 0) return 0
  return Math.round((occupiedNights / totalNights) * 100 * 100) / 100 // Round to 2 decimal places
}

// Encryption utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// URL utilities
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// File upload utilities
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

export function isValidImageType(fileType: string): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return validTypes.includes(fileType.toLowerCase())
}

export function generateStoragePath(userId: string, category: string, filename: string): string {
  const timestamp = Date.now()
  const extension = getFileExtension(filename)
  return `${userId}/${category}/${timestamp}.${extension}`
}

// Validation utilities
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"'&]/g, (char) => {
    switch (char) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      case "'": return '&#39;'
      case '&': return '&amp;'
      default: return char
    }
  })
}

// Platform-specific utilities
export function getPlatformDisplayName(platform: string): string {
  const platformNames: Record<string, string> = {
    airbnb: 'Airbnb',
    vrbo: 'VRBO',
    direct: 'Direct Booking',
    booking_com: 'Booking.com',
  }
  
  return platformNames[platform] || platform
}

export function getStatusDisplayName(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Reservation statuses
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    checked_in: 'bg-blue-100 text-blue-800',
    checked_out: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-600',
    
    // Cleaning statuses
    needed: 'bg-orange-100 text-orange-800',
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    verified: 'bg-emerald-100 text-emerald-800',
    
    // Apartment statuses
    active: 'bg-green-100 text-green-800',
    maintenance: 'bg-orange-100 text-orange-800',
    inactive: 'bg-red-100 text-red-800',
  }
  
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

// Debug utilities
export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString()
  const contextStr = context ? ` [${context}]` : ''
  
  console.error(`${timestamp}${contextStr}:`, error)
  
  // In production, you might want to send this to a logging service
  // Example: Sentry, LogRocket, etc.
}