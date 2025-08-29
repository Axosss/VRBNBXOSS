/**
 * Mapper for Cleanings
 * Converts between database format (snake_case) and application format
 * 
 * IMPORTANT: Major structural difference
 * - DB uses: scheduled_date (TIMESTAMPTZ) + duration (INTERVAL)
 * - Frontend uses: scheduled_start + scheduled_end (both strings)
 */

import type { CleaningDB, CleaningWithRelationsDB } from './types/database.types'
import type { Cleaning } from '@/types/cleaning'

/**
 * Convert DB scheduled_date + duration to start/end times
 * @param scheduledDate - The scheduled date from DB
 * @param duration - The duration interval from DB (e.g., "02:00:00")
 * @returns Object with scheduled_start and scheduled_end
 */
function convertScheduledDateTime(scheduledDate: string, duration: string | null) {
  const scheduled_start = scheduledDate
  
  // Calculate end time from duration if provided
  let scheduled_end = scheduledDate // Default to same as start if no duration
  
  if (duration) {
    // Parse duration (format: "HH:MM:SS")
    const durationMatch = duration.match(/^(\d+):(\d+):(\d+)$/)
    if (durationMatch) {
      const hours = parseInt(durationMatch[1])
      const minutes = parseInt(durationMatch[2])
      const endDate = new Date(scheduledDate)
      endDate.setHours(endDate.getHours() + hours)
      endDate.setMinutes(endDate.getMinutes() + minutes)
      scheduled_end = endDate.toISOString()
    }
  }
  
  return { scheduled_start, scheduled_end }
}

/**
 * Map a cleaning from database format to application format
 * @param db - The cleaning data from database (snake_case)
 * @returns The cleaning in application format
 */
export function mapCleaningFromDB(db: CleaningDB): Cleaning {
  // Validate required dates
  if (!db.scheduled_start || !db.scheduled_end) {
    console.error('Cleaning has invalid dates:', {
      id: db.id,
      scheduled_start: db.scheduled_start,
      scheduled_end: db.scheduled_end
    })
    
    // Set default dates if missing (current time + 2 hours)
    const now = new Date()
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    
    db.scheduled_start = db.scheduled_start || now.toISOString()
    db.scheduled_end = db.scheduled_end || twoHoursLater.toISOString()
  }
  
  // DB now has scheduled_start and scheduled_end directly
  return {
    id: db.id,
    
    // IDs - now in camelCase
    apartmentId: db.apartment_id,
    cleanerId: db.cleaner_id,
    reservationId: db.reservation_id,
    ownerId: db.owner_id || '',
    
    // Scheduling - now directly from DB
    scheduledStart: db.scheduled_start,
    scheduledEnd: db.scheduled_end,
    actualStart: db.actual_start || null,
    actualEnd: db.actual_end || null,
    
    status: db.status,
    cleaningType: db.cleaning_type || 'standard',
    
    instructions: db.instructions,
    supplies: db.supplies || {},
    
    // These fields are now in DB
    photos: db.photos || [],
    cost: db.cost || null,
    currency: db.currency || 'EUR',
    rating: db.rating || null,
    notes: db.notes || null,
    
    // Timestamps - now in camelCase
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

/**
 * Map a cleaning from application format to database format
 * @param app - The cleaning data from application
 * @returns The cleaning in database format (snake_case)
 */
export function mapCleaningToDB(app: Partial<Cleaning>): Partial<CleaningDB> {
  const result: Partial<CleaningDB> = {}
  
  // Map only defined fields - using camelCase from app
  if (app.id !== undefined) result.id = app.id
  if (app.apartmentId !== undefined) result.apartment_id = app.apartmentId
  if (app.cleanerId !== undefined) result.cleaner_id = app.cleanerId
  if (app.reservationId !== undefined) result.reservation_id = app.reservationId
  if (app.ownerId !== undefined) result.owner_id = app.ownerId
  
  // Map new time fields directly (DB now uses scheduled_start/end, not scheduled_date)
  if (app.scheduledStart !== undefined) result.scheduled_start = app.scheduledStart
  if (app.scheduledEnd !== undefined) result.scheduled_end = app.scheduledEnd
  if (app.actualStart !== undefined) result.actual_start = app.actualStart
  if (app.actualEnd !== undefined) result.actual_end = app.actualEnd
  
  if (app.status !== undefined) result.status = app.status
  if (app.cleaningType !== undefined) result.cleaning_type = app.cleaningType
  if (app.instructions !== undefined) result.instructions = app.instructions
  if (app.supplies !== undefined) result.supplies = app.supplies
  if (app.photos !== undefined) result.photos = app.photos
  if (app.cost !== undefined) result.cost = app.cost
  if (app.currency !== undefined) result.currency = app.currency
  if (app.rating !== undefined) result.rating = app.rating
  if (app.notes !== undefined) result.notes = app.notes
  
  return result
}

/**
 * Map a cleaning with relations from database format
 * @param db - The cleaning with joined data from database
 * @returns The cleaning with relations in application format
 */
export function mapCleaningWithRelationsFromDB(db: CleaningWithRelationsDB): Cleaning {
  const cleaning = mapCleaningFromDB(db)
  
  // Add related data if present
  if (db.apartment) {
    (cleaning as any).apartment = {
      id: db.apartment.id,
      name: db.apartment.name,
      address: db.apartment.address,
    }
  }
  
  if (db.cleaner) {
    (cleaning as any).cleaner = {
      id: db.cleaner.id,
      name: db.cleaner.name,
      email: db.cleaner.email,
      phone: db.cleaner.phone,
      rate: db.cleaner.rate,
    }
  }
  
  if (db.reservation) {
    (cleaning as any).reservation = {
      id: db.reservation.id,
      check_in: db.reservation.check_in,
      check_out: db.reservation.check_out,
      guest_name: db.reservation.guest_id, // Would need guest join for actual name
    }
  }
  
  return cleaning
}

/**
 * Map multiple cleanings from database format
 * @param dbList - Array of cleanings from database
 * @returns Array of cleanings in application format
 */
export function mapCleaningsFromDB(dbList: CleaningDB[]): Cleaning[] {
  return dbList.map(mapCleaningFromDB)
}