/**
 * @jest-environment node
 */

import { POST as photosPost, DELETE as photosDelete } from '@/app/api/apartments/[id]/photos/route'
import { createClient } from '@/lib/supabase/server'
import {
  createMockSupabaseClient,
  createTestUser,
  createTestApartment,
  expectSuccessResponse,
  expectErrorResponse,
  expectValidationError,
  mockDatabaseSuccess,
  mockDatabaseError,
} from '../utils/test-helpers'

// Mock the Supabase client
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Apartment Photos API Tests', () => {
  let mockSupabase: any
  const mockUser = createTestUser()
  const mockApartment = createTestApartment()

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase)
    
    // Mock authenticated user by default
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    jest.clearAllMocks()
  })

  describe('POST /api/apartments/[id]/photos', () => {
    it('should upload photo successfully', async () => {
      const updatedApartment = {
        ...mockApartment,
        photos: ['https://example.com/storage/photo.jpg'],
      }

      // Mock apartment ownership check
      mockSupabase._mockQueryBuilder.single.mockResolvedValueOnce(
        mockDatabaseSuccess(mockApartment)
      )

      // Mock file upload
      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'user123/apartments/apt123/1234567890.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/storage/photo.jpg' },
        }),
      })

      // Mock apartment update
      mockSupabase._mockQueryBuilder.single.mockResolvedValueOnce(
        mockDatabaseSuccess(updatedApartment)
      )

      // Create form data
      const formData = new FormData()
      const mockFile = new File(['mock image content'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('file', mockFile)

      const request = {
        formData: jest.fn().mockResolvedValue(formData),
      }

      const response = await photosPost(request as any, {
        params: { id: mockApartment.id }
      })
      const result = await response.json()

      expectSuccessResponse(result)
      expect(result.data.apartment).toMatchObject(updatedApartment)
      expect(result.data.uploadedPhoto.url).toBe('https://example.com/storage/photo.jpg')
      expect(result.message).toBe('Photo uploaded successfully')
      expect(response.status).toBe(201)
    })

    it('should validate apartment UUID', async () => {
      const request = {
        formData: jest.fn(),
      }

      const response = await photosPost(request as any, {
        params: { id: 'invalid-uuid' }
      })
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('Invalid apartment ID')
    })

    it('should handle unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = {
        formData: jest.fn(),
      }

      const response = await photosPost(request as any, {
        params: { id: mockApartment.id }
      })
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle apartment not found', async () => {
      mockSupabase._mockQueryBuilder.single.mockResolvedValue(
        mockDatabaseError('Row not found')
      )

      const request = {
        formData: jest.fn(),
      }

      const response = await photosPost(request as any, {
        params: { id: mockApartment.id }
      })
      const result = await response.json()

      expectErrorResponse(result, 404)
      expect(result.error).toBe('Apartment not found')
    })

    it('should handle missing file', async () => {
      mockSupabase._mockQueryBuilder.single.mockResolvedValue(
        mockDatabaseSuccess(mockApartment)
      )

      const formData = new FormData()
      const request = {
        formData: jest.fn().mockResolvedValue(formData),
      }

      const response = await photosPost(request as any, {
        params: { id: mockApartment.id }
      })
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('No file provided')
    })

    it('should validate file type', async () => {
      mockSupabase._mockQueryBuilder.single.mockResolvedValue(
        mockDatabaseSuccess(mockApartment)
      )

      const formData = new FormData()
      const mockFile = new File(['mock content'], 'test.pdf', { type: 'application/pdf' })
      formData.append('file', mockFile)

      const request = {
        formData: jest.fn().mockResolvedValue(formData),
      }

      const response = await photosPost(request as any, {
        params: { id: mockApartment.id }
      })
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toMatch(/invalid file type/i)
    })

    it('should validate file size', async () => {
      mockSupabase._mockQueryBuilder.single.mockResolvedValue(
        mockDatabaseSuccess(mockApartment)
      )

      const formData = new FormData()
      // Mock a large file (6MB)
      const largeContent = 'x'.repeat(6 * 1024 * 1024)
      const mockFile = new File([largeContent], 'test.jpg', { type: 'image/jpeg' })
      formData.append('file', mockFile)

      const request = {
        formData: jest.fn().mockResolvedValue(formData),
      }

      const response = await photosPost(request as any, {
        params: { id: mockApartment.id }
      })
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toMatch(/file size too large/i)
    })

    it('should handle upload failure', async () => {
      mockSupabase._mockQueryBuilder.single.mockResolvedValue(
        mockDatabaseSuccess(mockApartment)
      )

      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage quota exceeded' },
        }),
      })

      const formData = new FormData()
      const mockFile = new File(['mock content'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('file', mockFile)

      const request = {
        formData: jest.fn().mockResolvedValue(formData),
      }

      const response = await photosPost(request as any, {
        params: { id: mockApartment.id }
      })
      const result = await response.json()

      expectErrorResponse(result, 500)
      expect(result.error).toMatch(/upload failed/i)
    })
  })

  describe('DELETE /api/apartments/[id]/photos', () => {
    it('should delete photo successfully', async () => {
      const apartmentWithPhotos = {
        ...mockApartment,
        photos: ['https://example.com/storage/photo.jpg'],
      }
      
      const updatedApartment = {
        ...mockApartment,
        photos: [],
      }

      mockSupabase._mockQueryBuilder.single
        .mockResolvedValueOnce(mockDatabaseSuccess(apartmentWithPhotos))
        .mockResolvedValueOnce(mockDatabaseSuccess(updatedApartment))

      mockSupabase.storage.from.mockReturnValue({
        remove: jest.fn().mockResolvedValue({ error: null }),
      })

      const url = `http://localhost:3000/api/apartments/${mockApartment.id}/photos?url=${encodeURIComponent('https://example.com/storage/photo.jpg')}`
      const request = { url }

      const response = await photosDelete(request as any, {
        params: { id: mockApartment.id }
      })
      const result = await response.json()

      expectSuccessResponse(result)
      expect(result.data.photos).toEqual([])
      expect(result.message).toBe('Photo deleted successfully')
    })

    it('should handle photo not found in apartment', async () => {
      const apartmentWithPhotos = {
        ...mockApartment,
        photos: ['https://example.com/storage/other-photo.jpg'],
      }

      mockSupabase._mockQueryBuilder.single.mockResolvedValue(
        mockDatabaseSuccess(apartmentWithPhotos)
      )

      const url = `http://localhost:3000/api/apartments/${mockApartment.id}/photos?url=${encodeURIComponent('https://example.com/storage/nonexistent.jpg')}`
      const request = { url }

      const response = await photosDelete(request as any, {
        params: { id: mockApartment.id }
      })
      const result = await response.json()

      expectErrorResponse(result, 404)
      expect(result.error).toBe('Photo not found')
    })

    it('should handle missing photo URL parameter', async () => {
      const url = `http://localhost:3000/api/apartments/${mockApartment.id}/photos`
      const request = { url }

      const response = await photosDelete(request as any, {
        params: { id: mockApartment.id }
      })
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('Photo URL is required')
    })

    it('should continue deletion even if storage removal fails', async () => {
      const apartmentWithPhotos = {
        ...mockApartment,
        photos: ['https://example.com/storage/photo.jpg'],
      }
      
      const updatedApartment = {
        ...mockApartment,
        photos: [],
      }

      mockSupabase._mockQueryBuilder.single
        .mockResolvedValueOnce(mockDatabaseSuccess(apartmentWithPhotos))
        .mockResolvedValueOnce(mockDatabaseSuccess(updatedApartment))

      mockSupabase.storage.from.mockReturnValue({
        remove: jest.fn().mockResolvedValue({ 
          error: { message: 'File not found in storage' } 
        }),
      })

      const url = `http://localhost:3000/api/apartments/${mockApartment.id}/photos?url=${encodeURIComponent('https://example.com/storage/photo.jpg')}`
      const request = { url }

      const response = await photosDelete(request as any, {
        params: { id: mockApartment.id }
      })
      const result = await response.json()

      expectSuccessResponse(result)
      expect(result.data.photos).toEqual([])
    })
  })
})