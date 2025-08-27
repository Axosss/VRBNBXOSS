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
    
    // ID field (keeping snake_case for Phase 1)
    owner_id: db.owner_id, // TODO: Phase 2 - Change to ownerId
    
    // Basic info
    name: db.name,
    email: db.email,
    phone: db.phone,
    rate: db.rate,
    
    // Currency field doesn't exist in DB yet
    // Will need migration to add this field
    currency: null, // TODO: Add to DB migration
    
    // Timestamps (keeping snake_case for Phase 1)
    created_at: db.created_at, // TODO: Phase 2 - Change to createdAt
    updated_at: db.updated_at, // TODO: Phase 2 - Change to updatedAt
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