/**
 * Mapper for Apartments
 * Converts between database format (snake_case) and application format (camelCase)
 */

import type { ApartmentDB } from './types/database.types'
import type { Apartment } from '@/lib/stores/apartment-store'

/**
 * Map an apartment from database format to application format
 * @param db - The apartment data from database (snake_case)
 * @returns The apartment in application format (current mixed format)
 */
export function mapApartmentFromDB(db: ApartmentDB): Apartment {
  return {
    id: db.id,
    
    // ID fields (keeping snake_case for Phase 1)
    owner_id: db.owner_id, // TODO: Phase 2 - Change to ownerId
    
    // Basic info
    name: db.name,
    address: db.address, // Already an object in DB
    capacity: db.capacity,
    bedrooms: db.bedrooms || undefined,
    bathrooms: db.bathrooms || undefined,
    amenities: db.amenities || [],
    
    // Photos - IMPORTANT: DB stores strings, frontend expects objects
    // For Phase 1, we'll convert simple strings to objects
    photos: (db.photos || []).map((url, index) => ({
      id: `photo-${index}`,
      url: url,
      filename: url.split('/').pop() || 'photo.jpg',
      size: 0, // Unknown from DB
      is_main: index === 0,
      order: index
    })),
    
    // Access codes (keeping snake_case for Phase 1)
    access_codes: db.access_codes ? {
      wifi: db.access_codes.wifi,
      door: db.access_codes.door,
      mailbox: db.access_codes.mailbox,
      additional: db.access_codes.additional
    } : undefined,
    
    status: db.status,
    
    // Timestamps (keeping snake_case for Phase 1)
    created_at: db.created_at, // TODO: Phase 2 - Change to createdAt
    updated_at: db.updated_at, // TODO: Phase 2 - Change to updatedAt
  }
}

/**
 * Map an apartment from application format to database format
 * @param app - The apartment data from application
 * @returns The apartment in database format (snake_case)
 */
export function mapApartmentToDB(app: Partial<Apartment>): Partial<ApartmentDB> {
  const result: Partial<ApartmentDB> = {}
  
  // Map only defined fields
  if (app.id !== undefined) result.id = app.id
  if (app.owner_id !== undefined) result.owner_id = app.owner_id
  if (app.name !== undefined) result.name = app.name
  if (app.address !== undefined) result.address = app.address
  if (app.capacity !== undefined) result.capacity = app.capacity
  if (app.bedrooms !== undefined) result.bedrooms = app.bedrooms
  if (app.bathrooms !== undefined) result.bathrooms = app.bathrooms
  if (app.amenities !== undefined) result.amenities = app.amenities
  
  // Photos - convert objects back to strings for DB
  if (app.photos !== undefined) {
    result.photos = app.photos.map(photo => 
      typeof photo === 'string' ? photo : photo.url
    )
  }
  
  // Access codes - handle both formats
  if (app.access_codes !== undefined) {
    result.access_codes = app.access_codes
  }
  // Also check for camelCase version (for future)
  if ((app as any).accessCodes !== undefined) {
    result.access_codes = (app as any).accessCodes
  }
  
  if (app.status !== undefined) result.status = app.status
  
  // Don't send timestamps to DB (they're auto-managed)
  
  return result
}

/**
 * Map multiple apartments from database format
 * @param dbList - Array of apartments from database
 * @returns Array of apartments in application format
 */
export function mapApartmentsFromDB(dbList: ApartmentDB[]): Apartment[] {
  return dbList.map(mapApartmentFromDB)
}