/**
 * Mapper for Reservations
 * Converts between database format (snake_case) and application format (camelCase)
 */

import type { ReservationDB, ReservationWithRelationsDB } from './types/database.types'
import type { Reservation } from '@/lib/stores/reservation-store'

/**
 * Map a reservation from database format to application format
 * @param db - The reservation data from database (snake_case)
 * @returns The reservation in application format (camelCase)
 */
export function mapReservationFromDB(db: ReservationDB): Reservation {
  return {
    id: db.id,
    
    // ID fields - now in camelCase
    apartmentId: db.apartment_id,
    ownerId: db.owner_id,
    guestId: db.guest_id || '',
    
    // Platform information
    platform: db.platform,
    platformReservationId: db.platform_reservation_id,
    
    // Dates - now in camelCase
    checkIn: db.check_in,
    checkOut: db.check_out,
    
    // Guest and pricing information - now in camelCase
    guestName: db.guest_name,
    guestCount: db.guest_count,
    totalPrice: db.total_price,
    cleaningFee: db.cleaning_fee,
    platformFee: db.platform_fee,
    currency: db.currency,
    
    // Status and metadata
    status: db.status,
    notes: db.notes,
    contactInfo: db.contact_info,
    
    // Timestamps - now in camelCase
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

/**
 * Map a reservation from application format to database format
 * Used when creating or updating reservations
 * @param app - The reservation data from application (mixed case currently)
 * @returns The reservation in database format (snake_case)
 */
export function mapReservationToDB(app: Partial<Reservation>): Partial<ReservationDB> {
  const result: Partial<ReservationDB> = {}
  
  // Map only defined fields
  if (app.id !== undefined) result.id = app.id
  
  // Handle both old (snake_case) and new (camelCase) field names during transition
  if (app.apartment_id !== undefined) result.apartment_id = app.apartment_id
  if ((app as any).apartmentId !== undefined) result.apartment_id = (app as any).apartmentId
  
  if (app.owner_id !== undefined) result.owner_id = app.owner_id
  if ((app as any).ownerId !== undefined) result.owner_id = (app as any).ownerId
  
  if (app.guest_id !== undefined) result.guest_id = app.guest_id
  if ((app as any).guestId !== undefined) result.guest_id = (app as any).guestId
  
  // Platform fields
  if (app.platform !== undefined) result.platform = app.platform
  
  if (app.platform_reservation_id !== undefined) result.platform_reservation_id = app.platform_reservation_id
  if ((app as any).platformReservationId !== undefined) result.platform_reservation_id = (app as any).platformReservationId
  
  // Date fields
  if (app.check_in !== undefined) result.check_in = app.check_in
  if ((app as any).checkIn !== undefined) result.check_in = (app as any).checkIn
  
  if (app.check_out !== undefined) result.check_out = app.check_out
  if ((app as any).checkOut !== undefined) result.check_out = (app as any).checkOut
  
  // Numeric fields
  if (app.guest_count !== undefined) result.guest_count = app.guest_count
  if ((app as any).guestCount !== undefined) result.guest_count = (app as any).guestCount
  
  if (app.total_price !== undefined) result.total_price = app.total_price
  if ((app as any).totalPrice !== undefined) result.total_price = (app as any).totalPrice
  
  if (app.cleaning_fee !== undefined) result.cleaning_fee = app.cleaning_fee
  if ((app as any).cleaningFee !== undefined) result.cleaning_fee = (app as any).cleaningFee
  
  if (app.platform_fee !== undefined) result.platform_fee = app.platform_fee
  if ((app as any).platformFee !== undefined) result.platform_fee = (app as any).platformFee
  
  // Other fields
  if (app.currency !== undefined) result.currency = app.currency
  if (app.status !== undefined) result.status = app.status
  if (app.notes !== undefined) result.notes = app.notes
  
  if (app.contact_info !== undefined) result.contact_info = app.contact_info
  if ((app as any).contactInfo !== undefined) result.contact_info = (app as any).contactInfo
  
  // Don't send timestamps to DB (they're auto-managed)
  // created_at and updated_at are handled by the database
  
  return result
}

/**
 * Map a reservation with relations from database format
 * @param db - The reservation with joined data from database
 * @returns The reservation with relations in application format
 */
export function mapReservationWithRelationsFromDB(db: ReservationWithRelationsDB): Reservation {
  const reservation = mapReservationFromDB(db)
  
  // Add related data if present - now in camelCase
  if (db.apartment) {
    (reservation as any).apartment = {
      id: db.apartment.id,
      ownerId: db.apartment.owner_id,
      name: db.apartment.name,
      address: db.apartment.address,
      capacity: db.apartment.capacity,
      status: db.apartment.status,
    }
  }
  
  if (db.guest) {
    (reservation as any).guest = {
      id: db.guest.id,
      ownerId: db.guest.owner_id,
      name: db.guest.name,
      email: db.guest.email,
      phone: db.guest.phone,
    }
  }
  
  return reservation
}

/**
 * Map multiple reservations from database format
 * @param dbList - Array of reservations from database
 * @returns Array of reservations in application format
 */
export function mapReservationsFromDB(dbList: ReservationDB[]): Reservation[] {
  return dbList.map(mapReservationFromDB)
}

/**
 * Map multiple reservations with relations from database format
 * @param dbList - Array of reservations with relations from database
 * @returns Array of reservations with relations in application format
 */
export function mapReservationsWithRelationsFromDB(dbList: ReservationWithRelationsDB[]): Reservation[] {
  return dbList.map(mapReservationWithRelationsFromDB)
}