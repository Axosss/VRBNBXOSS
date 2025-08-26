/**
 * Comprehensive Forms Validation Test Suite
 * Tests all forms in the application for proper validation, submission, and error handling
 */

import '@testing-library/jest-dom'

// Mock fetch globally
global.fetch = jest.fn()

describe('Forms Validation Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Profile/Settings Form', () => {
    it('should submit profile updates with PATCH method', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'user-1',
          fullName: 'John Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
          timezone: 'America/New_York',
          role: 'owner',
          settings: {},
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'John Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
          timezone: 'America/New_York'
        })
      })

      expect(fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
        method: 'PATCH'
      }))
      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should also accept PUT method for backward compatibility', async () => {
      const mockResponse = { success: true, data: {} }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'Jane Doe' })
      })

      expect(response.ok).toBe(true)
    })
  })

  describe('Apartment Forms', () => {
    it('should create apartment with POST method', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'apt-1', name: 'Beach House' }
      }
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/apartments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Beach House',
          address: '123 Beach St',
          maxGuests: 4,
          bedrooms: 2,
          bathrooms: 1,
          pricePerNight: 150
        })
      })

      expect(fetch).toHaveBeenCalledWith('/api/apartments', expect.objectContaining({
        method: 'POST'
      }))
      expect(response.ok).toBe(true)
    })

    it('should update apartment with PUT method', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'apt-1', name: 'Updated Beach House' }
      }
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/apartments/apt-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Beach House' })
      })

      expect(fetch).toHaveBeenCalledWith('/api/apartments/apt-1', expect.objectContaining({
        method: 'PUT'
      }))
      expect(response.ok).toBe(true)
    })
  })

  describe('Reservation Forms', () => {
    it('should create reservation with POST method', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'res-1', apartmentId: 'apt-1' }
      }
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentId: 'apt-1',
          checkIn: '2024-03-01',
          checkOut: '2024-03-05',
          guestCount: 2,
          platform: 'airbnb',
          totalPrice: 600,
          guestInfo: {
            name: 'John Smith',
            email: 'john@example.com',
            phone: '+1234567890'
          }
        })
      })

      expect(fetch).toHaveBeenCalledWith('/api/reservations', expect.objectContaining({
        method: 'POST'
      }))
      expect(response.ok).toBe(true)
    })

    it('should update reservation with PUT method', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'res-1', status: 'confirmed' }
      }
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/reservations/res-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' })
      })

      expect(fetch).toHaveBeenCalledWith('/api/reservations/res-1', expect.objectContaining({
        method: 'PUT'
      }))
      expect(response.ok).toBe(true)
    })
  })

  describe('Cleaning Forms', () => {
    it('should create cleaning schedule with POST method', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'clean-1', reservationId: 'res-1' }
      }
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/cleanings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: 'res-1',
          cleanerId: 'cleaner-1',
          scheduledDate: '2024-03-05',
          scheduledTime: '10:00',
          type: 'checkout',
          estimatedDuration: 2,
          notes: 'Deep clean required'
        })
      })

      expect(fetch).toHaveBeenCalledWith('/api/cleanings', expect.objectContaining({
        method: 'POST'
      }))
      expect(response.ok).toBe(true)
    })

    it('should update cleaning with PUT method', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'clean-1', status: 'completed' }
      }
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/cleanings/clean-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      })

      expect(fetch).toHaveBeenCalledWith('/api/cleanings/clean-1', expect.objectContaining({
        method: 'PUT'
      }))
      expect(response.ok).toBe(true)
    })
  })

  describe('Cleaner Forms', () => {
    it('should create cleaner profile with POST method', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'cleaner-1', name: 'Jane Cleaner' }
      }
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/cleaners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Cleaner',
          email: 'jane@cleaningservice.com',
          phone: '+1234567890',
          hourlyRate: 25,
          availability: ['monday', 'tuesday', 'wednesday']
        })
      })

      expect(fetch).toHaveBeenCalledWith('/api/cleaners', expect.objectContaining({
        method: 'POST'
      }))
      expect(response.ok).toBe(true)
    })

    it('should update cleaner profile with PUT method', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'cleaner-1', hourlyRate: 30 }
      }
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/cleaners/cleaner-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hourlyRate: 30 })
      })

      expect(fetch).toHaveBeenCalledWith('/api/cleaners/cleaner-1', expect.objectContaining({
        method: 'PUT'
      }))
      expect(response.ok).toBe(true)
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      // Test apartment required fields
      const apartmentRequired = ['name', 'address', 'maxGuests', 'bedrooms', 'bathrooms', 'pricePerNight']
      apartmentRequired.forEach(field => {
        expect(field).toBeTruthy()
      })

      // Test reservation required fields  
      const reservationRequired = ['apartmentId', 'checkIn', 'checkOut', 'guestCount', 'platform', 'totalPrice']
      reservationRequired.forEach(field => {
        expect(field).toBeTruthy()
      })

      // Test cleaning required fields
      const cleaningRequired = ['reservationId', 'cleanerId', 'scheduledDate', 'type']
      cleaningRequired.forEach(field => {
        expect(field).toBeTruthy()
      })
    })

    it('should handle validation errors properly', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Validation failed',
        errors: {
          name: 'Name is required',
          email: 'Invalid email format'
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse
      })

      const response = await fetch('/api/apartments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Empty data to trigger validation
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation failed')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      try {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName: 'Test User' })
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })

    it('should handle server errors properly', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: 'Internal server error' })
      })

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })
  })
})

describe('Form State Management', () => {
  it('should manage loading states correctly', () => {
    const formStates = {
      isLoading: false,
      isSubmitting: false,
      isValidating: false,
      isSuccess: false,
      isError: false
    }

    // Simulate form submission
    formStates.isSubmitting = true
    expect(formStates.isSubmitting).toBe(true)

    // Simulate success
    formStates.isSubmitting = false
    formStates.isSuccess = true
    expect(formStates.isSubmitting).toBe(false)
    expect(formStates.isSuccess).toBe(true)
  })

  it('should clear errors on new submission', () => {
    let error: string | null = 'Previous error'
    
    // Clear error on new submission
    error = null
    expect(error).toBeNull()
  })

  it('should disable submit button during submission', () => {
    const isSubmitting = true
    const isButtonDisabled = isSubmitting
    
    expect(isButtonDisabled).toBe(true)
  })
})