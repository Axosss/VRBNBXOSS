/**
 * Mapper for Cleaners
 * Converts between database format (snake_case) and application format (camelCase)
 */

import type { CleanerDB } from './types/database.types'
import type { Cleaner } from '@/types/cleaning'

/**
 * Map a cleaner from database format to application format
 * @param db - The cleaner data from database (snake_case)
 * @returns The cleaner in application format (current mixed format)
 */
export function mapCleanerFromDB(db: CleanerDB): Cleaner {
  return {
    id: db.id,
    
    // ID field - now in camelCase
    ownerId: db.owner_id,
    
    // Basic info
    name: db.name,
    email: db.email,
    phone: db.phone,
    rate: db.rate,
    
    // Additional fields from DB
    active: db.active,
    services: db.services || [],
    rating: db.rating,
    currency: db.currency || 'EUR',
    hourlyRate: db.rate, // Alias for compatibility
    flatRate: null, // Not in current DB
    
    // Timestamps - now in camelCase
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

/**
 * Map a cleaner from application format to database format
 * @param app - The cleaner data from application
 * @returns The cleaner in database format (snake_case)
 */
export function mapCleanerToDB(app: Partial<Cleaner>): Partial<CleanerDB> {
  const result: Partial<CleanerDB> = {}
  
  // Map only defined fields
  if (app.id !== undefined) result.id = app.id
  if (app.owner_id !== undefined) result.owner_id = app.owner_id
  
  // Also check for camelCase version (for future)
  if ((app as any).ownerId !== undefined) result.owner_id = (app as any).ownerId
  
  if (app.name !== undefined) result.name = app.name
  if (app.email !== undefined) result.email = app.email || null
  if (app.phone !== undefined) result.phone = app.phone || null
  if (app.rate !== undefined) result.rate = app.rate || null
  
  // Note: currency field can't be saved to current DB schema
  // Needs migration to add this column
  
  // Don't send timestamps to DB (they're auto-managed)
  
  return result
}

/**
 * Map multiple cleaners from database format
 * @param dbList - Array of cleaners from database
 * @returns Array of cleaners in application format
 */
export function mapCleanersFromDB(dbList: CleanerDB[]): Cleaner[] {
  return dbList.map(mapCleanerFromDB)
}