/**
 * Tests for Reservation Mapper
 */

import { 
  mapReservationFromDB, 
  mapReservationToDB,
  mapReservationWithRelationsFromDB,
  mapReservationsFromDB
} from '../reservation.mapper'
import type { ReservationDB, ReservationWithRelationsDB } from '../types/database.types'

describe('Reservation Mapper', () => {
  const mockReservationDB: ReservationDB = {
    id: 'res-123',
    apartment_id: 'apt-456',
    owner_id: 'owner-789',
    guest_id: 'guest-101',
    platform: 'airbnb',
    platform_reservation_id: 'AIRBNB-123',
    check_in: '2024-02-01',
    check_out: '2024-02-05',
    guest_count: 2,
    total_price: 500,
    cleaning_fee: 50,
    platform_fee: 25,
    currency: 'USD',
    status: 'confirmed',
    notes: 'Test reservation',
    contact_info: { phone: '+1234567890' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  }

  describe('mapReservationFromDB', () => {
    it('should map all fields correctly from snake_case to current format', () => {
      const result = mapReservationFromDB(mockReservationDB)

      // Check ID fields (still snake_case in Phase 1)
      expect(result.id).toBe('res-123')
      expect(result.apartment_id).toBe('apt-456')
      expect(result.owner_id).toBe('owner-789')
      expect(result.guest_id).toBe('guest-101')

      // Check platform fields
      expect(result.platform).toBe('airbnb')
      expect(result.platform_reservation_id).toBe('AIRBNB-123')

      // Check date fields (still snake_case in Phase 1)
      expect(result.check_in).toBe('2024-02-01')
      expect(result.check_out).toBe('2024-02-05')

      // Check numeric fields (still snake_case in Phase 1)
      expect(result.guest_count).toBe(2)
      expect(result.total_price).toBe(500)
      expect(result.cleaning_fee).toBe(50)
      expect(result.platform_fee).toBe(25)

      // Check other fields
      expect(result.currency).toBe('USD')
      expect(result.status).toBe('confirmed')
      expect(result.notes).toBe('Test reservation')
      expect(result.contact_info).toEqual({ phone: '+1234567890' })

      // Check timestamps (still snake_case in Phase 1)
      expect(result.created_at).toBe('2024-01-01T00:00:00Z')
      expect(result.updated_at).toBe('2024-01-02T00:00:00Z')
    })

    it('should handle null values correctly', () => {
      const dbWithNulls: ReservationDB = {
        ...mockReservationDB,
        guest_id: null,
        platform_reservation_id: null,
        cleaning_fee: null,
        platform_fee: null,
        notes: null,
        contact_info: null,
      }

      const result = mapReservationFromDB(dbWithNulls)

      expect(result.guest_id).toBe('')
      expect(result.platform_reservation_id).toBeNull()
      expect(result.cleaning_fee).toBeNull()
      expect(result.platform_fee).toBeNull()
      expect(result.notes).toBeNull()
      expect(result.contact_info).toBeNull()
    })
  })

  describe('mapReservationToDB', () => {
    it('should map fields from application format to database format', () => {
      const appData = {
        apartment_id: 'apt-123',
        guest_id: 'guest-456',
        platform: 'vrbo' as const,
        check_in: '2024-03-01',
        check_out: '2024-03-05',
        guest_count: 3,
        total_price: 600,
        currency: 'EUR',
      }

      const result = mapReservationToDB(appData)

      expect(result.apartment_id).toBe('apt-123')
      expect(result.guest_id).toBe('guest-456')
      expect(result.platform).toBe('vrbo')
      expect(result.check_in).toBe('2024-03-01')
      expect(result.check_out).toBe('2024-03-05')
      expect(result.guest_count).toBe(3)
      expect(result.total_price).toBe(600)
      expect(result.currency).toBe('EUR')
    })

    it('should handle both snake_case and camelCase input during transition', () => {
      // Test with camelCase fields (for future compatibility)
      const camelCaseData = {
        apartmentId: 'apt-999',
        guestId: 'guest-888',
        checkIn: '2024-04-01',
        checkOut: '2024-04-03',
        guestCount: 4,
        totalPrice: 800,
        cleaningFee: 60,
        platformFee: 30,
      }

      const result = mapReservationToDB(camelCaseData as any)

      expect(result.apartment_id).toBe('apt-999')
      expect(result.guest_id).toBe('guest-888')
      expect(result.check_in).toBe('2024-04-01')
      expect(result.check_out).toBe('2024-04-03')
      expect(result.guest_count).toBe(4)
      expect(result.total_price).toBe(800)
      expect(result.cleaning_fee).toBe(60)
      expect(result.platform_fee).toBe(30)
    })

    it('should only include defined fields', () => {
      const partialData = {
        apartment_id: 'apt-111',
        check_in: '2024-05-01',
      }

      const result = mapReservationToDB(partialData)

      expect(result).toEqual({
        apartment_id: 'apt-111',
        check_in: '2024-05-01',
      })
      
      // Check that undefined fields are not included
      expect('guest_id' in result).toBe(false)
      expect('check_out' in result).toBe(false)
    })

    it('should not include timestamps (managed by database)', () => {
      const dataWithTimestamps = {
        apartment_id: 'apt-222',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      const result = mapReservationToDB(dataWithTimestamps)

      expect(result.apartment_id).toBe('apt-222')
      expect('created_at' in result).toBe(false)
      expect('updated_at' in result).toBe(false)
    })
  })

  describe('mapReservationWithRelationsFromDB', () => {
    it('should map reservation with apartment relation', () => {
      const dbWithRelations: ReservationWithRelationsDB = {
        ...mockReservationDB,
        apartment: {
          id: 'apt-456',
          owner_id: 'owner-789',
          name: 'Beach House',
          address: {
            street: '123 Ocean Ave',
            city: 'Miami',
            state: 'FL',
            zipCode: '33139',
            country: 'USA',
          },
          capacity: 4,
          bedrooms: 2,
          bathrooms: 1.5,
          amenities: ['WiFi', 'Parking'],
          photos: ['photo1.jpg'],
          access_codes: { door: '1234' },
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      }

      const result = mapReservationWithRelationsFromDB(dbWithRelations)

      expect(result.id).toBe('res-123')
      expect((result as any).apartment).toBeDefined()
      expect((result as any).apartment.name).toBe('Beach House')
      expect((result as any).apartment.capacity).toBe(4)
    })

    it('should map reservation with guest relation', () => {
      const dbWithGuest: ReservationWithRelationsDB = {
        ...mockReservationDB,
        guest: {
          id: 'guest-101',
          owner_id: 'owner-789',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          id_document: null,
          address: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      }

      const result = mapReservationWithRelationsFromDB(dbWithGuest)

      expect(result.id).toBe('res-123')
      expect((result as any).guest).toBeDefined()
      expect((result as any).guest.name).toBe('John Doe')
      expect((result as any).guest.email).toBe('john@example.com')
    })
  })

  describe('mapReservationsFromDB', () => {
    it('should map multiple reservations', () => {
      const dbList: ReservationDB[] = [
        mockReservationDB,
        {
          ...mockReservationDB,
          id: 'res-456',
          apartment_id: 'apt-789',
        },
      ]

      const result = mapReservationsFromDB(dbList)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('res-123')
      expect(result[1].id).toBe('res-456')
      expect(result[1].apartment_id).toBe('apt-789')
    })

    it('should handle empty array', () => {
      const result = mapReservationsFromDB([])
      expect(result).toEqual([])
    })
  })
})