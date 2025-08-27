/**
 * Central export for all mappers
 * This provides a single entry point for all data transformation functions
 */

// Export types
export * from './types'

// Export utilities
export * from './utils/case-converter'

// Export all mappers
export * from './reservation.mapper'
export * from './apartment.mapper'
export * from './cleaning.mapper'
export * from './guest.mapper'
export * from './cleaner.mapper'

/**
 * Import mapper functions
 */
import {
  mapReservationFromDB,
  mapReservationToDB,
  mapReservationWithRelationsFromDB,
  mapReservationsFromDB,
  mapReservationsWithRelationsFromDB
} from './reservation.mapper'

import {
  mapApartmentFromDB,
  mapApartmentToDB,
  mapApartmentsFromDB
} from './apartment.mapper'

import {
  mapCleaningFromDB,
  mapCleaningToDB,
  mapCleaningsFromDB,
  mapCleaningWithRelationsFromDB
} from './cleaning.mapper'

import {
  mapGuestFromDB,
  mapGuestToDB,
  mapGuestsFromDB
} from './guest.mapper'

import {
  mapCleanerFromDB,
  mapCleanerToDB,
  mapCleanersFromDB
} from './cleaner.mapper'

/**
 * Central mapper registry
 * Provides a convenient way to access all mappers
 */
export const dbMappers = {
  reservation: {
    fromDB: mapReservationFromDB,
    toDB: mapReservationToDB,
    withRelationsFromDB: mapReservationWithRelationsFromDB,
    multipleFromDB: mapReservationsFromDB,
    multipleWithRelationsFromDB: mapReservationsWithRelationsFromDB,
  },
  apartment: {
    fromDB: mapApartmentFromDB,
    toDB: mapApartmentToDB,
    multipleFromDB: mapApartmentsFromDB,
  },
  cleaning: {
    fromDB: mapCleaningFromDB,
    toDB: mapCleaningToDB,
    multipleFromDB: mapCleaningsFromDB,
    withRelationsFromDB: mapCleaningWithRelationsFromDB,
  },
  guest: {
    fromDB: mapGuestFromDB,
    toDB: mapGuestToDB,
    multipleFromDB: mapGuestsFromDB,
  },
  cleaner: {
    fromDB: mapCleanerFromDB,
    toDB: mapCleanerToDB,
    multipleFromDB: mapCleanersFromDB,
  },
}