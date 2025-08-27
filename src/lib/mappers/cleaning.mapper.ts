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
  const { scheduled_start, scheduled_end } = convertScheduledDateTime(
    db.scheduled_date,
    db.duration
  )

  // Note: Many fields don't exist in current DB schema
  // They will need to be added via migration
  return {
    id: db.id,
    
    // IDs (keeping snake_case for Phase 1)
    apartment_id: db.apartment_id,
    cleaner_id: db.cleaner_id,
    reservation_id: db.reservation_id,
    owner_id: '', // TODO: Not in DB, needs migration
    
    // Scheduling - converted from DB format
    scheduled_start,
    scheduled_end,
    
    // These fields don't exist in current DB - will be null/default
    actual_start: null,
    actual_end: null,
    
    status: db.status,
    
    // cleaning_type doesn't exist in DB yet
    cleaning_type: 'standard', // Default value
    
    instructions: db.instructions,
    supplies: db.supplies || {},
    
    // These fields don't exist in current DB
    photos: [],
    cost: null,
    currency: 'EUR', // Default value
    rating: null,
    notes: null,
    
    // Timestamps (keeping snake_case for Phase 1)
    created_at: db.created_at,
    updated_at: db.updated_at,
  }
}

/**
 * Map a cleaning from application format to database format
 * @param app - The cleaning data from application
 * @returns The cleaning in database format (snake_case)
 */
export function mapCleaningToDB(app: Partial<Cleaning>): Partial<CleaningDB> {
  const result: Partial<CleaningDB> = {}
  
  // Map only defined fields
  if (app.id !== undefined) result.id = app.id
  if (app.apartment_id !== undefined) result.apartment_id = app.apartment_id
  if (app.cleaner_id !== undefined) result.cleaner_id = app.cleaner_id
  if (app.reservation_id !== undefined) result.reservation_id = app.reservation_id
  
  // Convert start/end times to scheduled_date + duration
  if (app.scheduled_start !== undefined) {
    result.scheduled_date = app.scheduled_start
    
    // Calculate duration if end time is provided
    if (app.scheduled_end) {
      const start = new Date(app.scheduled_start)
      const end = new Date(app.scheduled_end)
      const durationMs = end.getTime() - start.getTime()
      const hours = Math.floor(durationMs / (1000 * 60 * 60))
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
      result.duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
    }
  }
  
  if (app.status !== undefined) result.status = app.status
  if (app.instructions !== undefined) result.instructions = app.instructions
  if (app.supplies !== undefined) result.supplies = app.supplies
  
  // Note: Many frontend fields can't be saved to current DB schema
  // They need migration: actual_start/end, cleaning_type, photos, cost, rating, notes
  
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