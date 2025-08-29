/**
 * Mapper for Guests
 * Converts between database format (snake_case) and application format (camelCase)
 */

import type { GuestDB } from './types/database.types'
import type { Guest } from '@/lib/stores/reservation-store'

/**
 * Map a guest from database format to application format
 * @param db - The guest data from database (snake_case)
 * @returns The guest in application format (current mixed format)
 */
export function mapGuestFromDB(db: GuestDB): Guest {
  return {
    id: db.id,
    
    // ID field - now in camelCase
    ownerId: db.owner_id,
    
    // Basic info
    name: db.name,
    email: db.email || undefined,
    phone: db.phone || undefined,
    
    // Address - already structured in DB
    address: db.address || undefined,
    
    // ID document (already in camelCase)
    idDocument: db.id_document || undefined,
    
    // Additional fields
    notes: db.notes || undefined,
    blacklisted: db.blacklisted || false,
    
    // Timestamps - now in camelCase
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

/**
 * Map a guest from application format to database format
 * @param app - The guest data from application
 * @returns The guest in database format (snake_case)
 */
export function mapGuestToDB(app: Partial<Guest>): Partial<GuestDB> {
  const result: Partial<GuestDB> = {}
  
  // Map only defined fields
  if (app.id !== undefined) result.id = app.id
  if (app.owner_id !== undefined) result.owner_id = app.owner_id
  
  // Also check for camelCase version (for future)
  if ((app as any).ownerId !== undefined) result.owner_id = (app as any).ownerId
  
  if (app.name !== undefined) result.name = app.name
  if (app.email !== undefined) result.email = app.email || null
  if (app.phone !== undefined) result.phone = app.phone || null
  if (app.address !== undefined) result.address = app.address || null
  
  // Handle idDocument field
  if (app.idDocument !== undefined) result.id_document = app.idDocument || null
  
  // Don't send timestamps to DB (they're auto-managed)
  
  return result
}

/**
 * Map multiple guests from database format
 * @param dbList - Array of guests from database
 * @returns Array of guests in application format
 */
export function mapGuestsFromDB(dbList: GuestDB[]): Guest[] {
  return dbList.map(mapGuestFromDB)
}