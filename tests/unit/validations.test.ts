/**
 * @jest-environment node
 */

import { z } from 'zod'
import {
  signUpSchema,
  signInSchema,
  profileUpdateSchema,
  apartmentCreateSchema,
  apartmentUpdateSchema,
  reservationCreateSchema,
  reservationUpdateSchema,
  paginationSchema,
  dateRangeSchema,
  apartmentFilterSchema,
  reservationFilterSchema,
} from '@/lib/validations'

describe('Validation Schemas', () => {
  describe('signUpSchema', () => {
    it('should validate valid signup data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
      }

      const result = signUpSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        fullName: 'John Doe',
      }

      expect(() => signUpSchema.parse(invalidData)).toThrow(/invalid email/i)
    })

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '1234567',
        fullName: 'John Doe',
      }

      expect(() => signUpSchema.parse(invalidData)).toThrow(/password must be at least 8 characters/i)
    })

    it('should reject full name shorter than 2 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'A',
      }

      expect(() => signUpSchema.parse(invalidData)).toThrow(/full name must be at least 2 characters/i)
    })

    it('should reject missing required fields', () => {
      expect(() => signUpSchema.parse({})).toThrow()
      expect(() => signUpSchema.parse({ email: 'test@example.com' })).toThrow()
      expect(() => signUpSchema.parse({ email: 'test@example.com', password: 'password123' })).toThrow()
    })
  })

  describe('signInSchema', () => {
    it('should validate valid signin data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const result = signInSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      }

      expect(() => signInSchema.parse(invalidData)).toThrow(/invalid email/i)
    })

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      }

      expect(() => signInSchema.parse(invalidData)).toThrow(/password is required/i)
    })
  })

  describe('profileUpdateSchema', () => {
    it('should validate valid profile update data', () => {
      const validData = {
        fullName: 'John Doe Updated',
        avatarUrl: 'https://example.com/avatar.jpg',
        timezone: 'America/New_York',
        settings: { theme: 'dark' },
      }

      const result = profileUpdateSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should allow partial updates', () => {
      const partialData = { fullName: 'John Doe' }
      const result = profileUpdateSchema.parse(partialData)
      expect(result).toEqual(partialData)
    })

    it('should allow null avatar URL', () => {
      const dataWithNullAvatar = { 
        fullName: 'John Doe',
        avatarUrl: null 
      }
      const result = profileUpdateSchema.parse(dataWithNullAvatar)
      expect(result.avatarUrl).toBeNull()
    })

    it('should reject invalid avatar URL', () => {
      const invalidData = {
        fullName: 'John Doe',
        avatarUrl: 'not-a-url',
      }

      expect(() => profileUpdateSchema.parse(invalidData)).toThrow(/invalid avatar url/i)
    })

    it('should reject full name shorter than 2 characters', () => {
      const invalidData = { fullName: 'A' }
      expect(() => profileUpdateSchema.parse(invalidData)).toThrow(/full name must be at least 2 characters/i)
    })

    it('should allow empty object', () => {
      const result = profileUpdateSchema.parse({})
      expect(result).toEqual({})
    })
  })

  describe('apartmentCreateSchema', () => {
    const validApartmentData = {
      name: 'Test Apartment',
      address: {
        street: '123 Main St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
      },
      capacity: 4,
      bedrooms: 2,
      bathrooms: 1.5,
      amenities: ['wifi', 'kitchen'],
      accessCodes: {
        wifi: { network: 'TestNet', password: 'testpass' },
        door: '1234',
      },
    }

    it('should validate valid apartment data', () => {
      const result = apartmentCreateSchema.parse(validApartmentData)
      expect(result).toEqual(validApartmentData)
    })

    it('should reject missing required fields', () => {
      expect(() => apartmentCreateSchema.parse({})).toThrow()
      expect(() => apartmentCreateSchema.parse({ name: 'Test' })).toThrow()
      expect(() => apartmentCreateSchema.parse({ 
        name: 'Test',
        address: { street: '123 Main' } // Missing required address fields
      })).toThrow()
    })

    it('should reject invalid capacity', () => {
      const invalidData = { ...validApartmentData, capacity: 0 }
      expect(() => apartmentCreateSchema.parse(invalidData)).toThrow(/capacity must be at least 1/i)

      const negativeCapacity = { ...validApartmentData, capacity: -1 }
      expect(() => apartmentCreateSchema.parse(negativeCapacity)).toThrow()
    })

    it('should reject negative bedrooms', () => {
      const invalidData = { ...validApartmentData, bedrooms: -1 }
      expect(() => apartmentCreateSchema.parse(invalidData)).toThrow(/bedrooms cannot be negative/i)
    })

    it('should reject negative bathrooms', () => {
      const invalidData = { ...validApartmentData, bathrooms: -0.5 }
      expect(() => apartmentCreateSchema.parse(invalidData)).toThrow(/bathrooms cannot be negative/i)
    })

    it('should allow optional fields to be omitted', () => {
      const minimalData = {
        name: 'Test Apartment',
        address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
        },
        capacity: 4,
      }

      const result = apartmentCreateSchema.parse(minimalData)
      expect(result).toMatchObject(minimalData)
    })

    it('should validate all required address fields', () => {
      const incompleteAddress = {
        name: 'Test Apartment',
        address: {
          street: '123 Main St',
          city: 'Test City',
          // Missing state, zipCode, country
        },
        capacity: 4,
      }

      expect(() => apartmentCreateSchema.parse(incompleteAddress)).toThrow()
    })
  })

  describe('reservationCreateSchema', () => {
    const validReservationData = {
      apartmentId: '550e8400-e29b-41d4-a716-446655440000',
      guestId: '550e8400-e29b-41d4-a716-446655440001',
      platform: 'airbnb' as const,
      platformReservationId: 'AIRBNB123',
      checkIn: '2024-12-25',
      checkOut: '2024-12-28',
      guestCount: 2,
      totalPrice: 300.00,
      cleaningFee: 50.00,
      platformFee: 25.00,
      currency: 'USD',
      notes: 'Test reservation',
    }

    it('should validate valid reservation data', () => {
      const result = reservationCreateSchema.parse(validReservationData)
      expect(result).toEqual(validReservationData)
    })

    it('should reject invalid apartment UUID', () => {
      const invalidData = { ...validReservationData, apartmentId: 'invalid-uuid' }
      expect(() => reservationCreateSchema.parse(invalidData)).toThrow(/invalid apartment id/i)
    })

    it('should reject invalid guest UUID', () => {
      const invalidData = { ...validReservationData, guestId: 'invalid-uuid' }
      expect(() => reservationCreateSchema.parse(invalidData)).toThrow(/invalid guest id/i)
    })

    it('should accept null guest ID', () => {
      const dataWithNullGuest = { ...validReservationData, guestId: null }
      const result = reservationCreateSchema.parse(dataWithNullGuest)
      expect(result.guestId).toBeNull()
    })

    it('should validate platform enum', () => {
      const invalidData = { ...validReservationData, platform: 'invalid-platform' }
      expect(() => reservationCreateSchema.parse(invalidData)).toThrow()

      // Test valid platforms
      const validPlatforms = ['airbnb', 'vrbo', 'direct', 'booking_com']
      validPlatforms.forEach(platform => {
        const data = { ...validReservationData, platform }
        expect(() => reservationCreateSchema.parse(data)).not.toThrow()
      })
    })

    it('should validate date formats', () => {
      const invalidCheckIn = { ...validReservationData, checkIn: 'invalid-date' }
      expect(() => reservationCreateSchema.parse(invalidCheckIn)).toThrow(/invalid check-in date/i)

      const invalidCheckOut = { ...validReservationData, checkOut: 'invalid-date' }
      expect(() => reservationCreateSchema.parse(invalidCheckOut)).toThrow(/invalid check-out date/i)
    })

    it('should validate check-out after check-in', () => {
      const invalidDates = { 
        ...validReservationData, 
        checkIn: '2024-12-28',
        checkOut: '2024-12-25' // Earlier than check-in
      }
      expect(() => reservationCreateSchema.parse(invalidDates)).toThrow(/check-out date must be after check-in date/i)
    })

    it('should reject negative prices', () => {
      const negativePrice = { ...validReservationData, totalPrice: -100 }
      expect(() => reservationCreateSchema.parse(negativePrice)).toThrow(/total price cannot be negative/i)

      const negativeCleaningFee = { ...validReservationData, cleaningFee: -10 }
      expect(() => reservationCreateSchema.parse(negativeCleaningFee)).toThrow(/cleaning fee cannot be negative/i)

      const negativePlatformFee = { ...validReservationData, platformFee: -5 }
      expect(() => reservationCreateSchema.parse(negativePlatformFee)).toThrow(/platform fee cannot be negative/i)
    })

    it('should reject zero or negative guest count', () => {
      const zeroGuests = { ...validReservationData, guestCount: 0 }
      expect(() => reservationCreateSchema.parse(zeroGuests)).toThrow(/guest count must be at least 1/i)

      const negativeGuests = { ...validReservationData, guestCount: -1 }
      expect(() => reservationCreateSchema.parse(negativeGuests)).toThrow()
    })

    it('should validate currency length', () => {
      const invalidCurrency = { ...validReservationData, currency: 'INVALID' }
      expect(() => reservationCreateSchema.parse(invalidCurrency)).toThrow(/currency must be 3 characters/i)
    })

    it('should use default currency', () => {
      const { currency, ...dataWithoutCurrency } = validReservationData
      const result = reservationCreateSchema.parse(dataWithoutCurrency)
      expect(result.currency).toBe('USD')
    })
  })

  describe('paginationSchema', () => {
    it('should validate valid pagination', () => {
      const validData = { page: 2, limit: 25 }
      const result = paginationSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should use defaults when not provided', () => {
      const result = paginationSchema.parse({})
      expect(result).toEqual({ page: 1, limit: 10 })
    })

    it('should coerce string numbers', () => {
      const stringData = { page: '3', limit: '50' }
      const result = paginationSchema.parse(stringData)
      expect(result).toEqual({ page: 3, limit: 50 })
    })

    it('should reject page less than 1', () => {
      expect(() => paginationSchema.parse({ page: 0 })).toThrow()
      expect(() => paginationSchema.parse({ page: -1 })).toThrow()
    })

    it('should reject limit greater than 100', () => {
      expect(() => paginationSchema.parse({ limit: 101 })).toThrow()
    })

    it('should reject limit less than 1', () => {
      expect(() => paginationSchema.parse({ limit: 0 })).toThrow()
      expect(() => paginationSchema.parse({ limit: -1 })).toThrow()
    })
  })

  describe('dateRangeSchema', () => {
    it('should validate valid date range', () => {
      const validData = {
        startDate: '2024-12-01',
        endDate: '2024-12-31',
      }
      const result = dateRangeSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should accept equal start and end dates', () => {
      const sameDate = {
        startDate: '2024-12-25',
        endDate: '2024-12-25',
      }
      const result = dateRangeSchema.parse(sameDate)
      expect(result).toEqual(sameDate)
    })

    it('should reject invalid date formats', () => {
      const invalidStart = {
        startDate: 'invalid-date',
        endDate: '2024-12-31',
      }
      expect(() => dateRangeSchema.parse(invalidStart)).toThrow(/invalid start date/i)

      const invalidEnd = {
        startDate: '2024-12-01',
        endDate: 'invalid-date',
      }
      expect(() => dateRangeSchema.parse(invalidEnd)).toThrow(/invalid end date/i)
    })

    it('should reject end date before start date', () => {
      const invalidRange = {
        startDate: '2024-12-31',
        endDate: '2024-12-01',
      }
      expect(() => dateRangeSchema.parse(invalidRange)).toThrow(/end date must be after or equal to start date/i)
    })
  })

  describe('apartmentFilterSchema', () => {
    it('should validate valid filters', () => {
      const validData = {
        status: 'active' as const,
        search: 'downtown',
      }
      const result = apartmentFilterSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should validate status enum', () => {
      const validStatuses = ['active', 'maintenance', 'inactive']
      validStatuses.forEach(status => {
        const data = { status }
        expect(() => apartmentFilterSchema.parse(data)).not.toThrow()
      })

      const invalidStatus = { status: 'invalid-status' }
      expect(() => apartmentFilterSchema.parse(invalidStatus)).toThrow()
    })

    it('should allow optional fields', () => {
      expect(() => apartmentFilterSchema.parse({})).not.toThrow()
      expect(() => apartmentFilterSchema.parse({ status: 'active' })).not.toThrow()
      expect(() => apartmentFilterSchema.parse({ search: 'test' })).not.toThrow()
    })
  })

  describe('reservationFilterSchema', () => {
    it('should validate valid filters', () => {
      const validData = {
        status: 'confirmed' as const,
        platform: 'airbnb' as const,
        apartmentId: '550e8400-e29b-41d4-a716-446655440000',
      }
      const result = reservationFilterSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should validate status enum', () => {
      const validStatuses = ['draft', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'archived']
      validStatuses.forEach(status => {
        const data = { status }
        expect(() => reservationFilterSchema.parse(data)).not.toThrow()
      })
    })

    it('should validate platform enum', () => {
      const validPlatforms = ['airbnb', 'vrbo', 'direct', 'booking_com']
      validPlatforms.forEach(platform => {
        const data = { platform }
        expect(() => reservationFilterSchema.parse(data)).not.toThrow()
      })
    })

    it('should validate apartment UUID', () => {
      const invalidUuid = { apartmentId: 'invalid-uuid' }
      expect(() => reservationFilterSchema.parse(invalidUuid)).toThrow()
    })

    it('should allow all optional fields', () => {
      expect(() => reservationFilterSchema.parse({})).not.toThrow()
    })
  })
})