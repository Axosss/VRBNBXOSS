/**
 * @jest-environment node
 */

import { GET as healthGet } from '@/app/api/health/route'
import { createClient } from '@/lib/supabase/server'
import {
  createMockSupabaseClient,
  createMockRequest,
  expectSuccessResponse,
  expectErrorResponse,
  mockDatabaseSuccess,
  mockDatabaseError,
} from '../utils/test-helpers'

// Mock the Supabase client
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Health API Tests', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase)
    
    // Mock process methods
    process.uptime = jest.fn().mockReturnValue(3600) // 1 hour uptime
    process.memoryUsage = jest.fn().mockReturnValue({
      rss: 50 * 1024 * 1024,
      heapTotal: 30 * 1024 * 1024,
      heapUsed: 20 * 1024 * 1024,
      external: 5 * 1024 * 1024,
      arrayBuffers: 1 * 1024 * 1024,
    })

    jest.clearAllMocks()
  })

  describe('GET /api/health', () => {
    it('should return healthy status when database is accessible', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDatabaseSuccess([])),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await healthGet(request as any)
      const result = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockQuery.select).toHaveBeenCalledWith('count')
      expect(mockQuery.limit).toHaveBeenCalledWith(1)

      expectSuccessResponse(result)
      expect(result.data.status).toBe('healthy')
      expect(result.data).toHaveProperty('timestamp')
      expect(result.data).toHaveProperty('version')
      expect(result.data).toHaveProperty('uptime', 3600)
      expect(result.data).toHaveProperty('environment')
      expect(result.data.services.database.status).toBe('healthy')
      expect(result.data.services.database).toHaveProperty('responseTime')
      expect(result.data.services.supabase.status).toBe('healthy')
      expect(result.data.system).toHaveProperty('nodeVersion')
      expect(result.data.system).toHaveProperty('platform')
      expect(result.data.system.memory).toMatchObject({
        used: 20,
        total: 30,
      })
    })

    it('should return unhealthy status when database is not accessible', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDatabaseError('Connection failed')),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await healthGet(request as any)
      const result = await response.json()

      expect(response.status).toBe(503)
      expect(result.success).toBe(false)
      expect(result.status).toBe('unhealthy')
      expect(result.error).toMatch(/database connection failed/i)
      expect(result).toHaveProperty('timestamp')
    })

    it('should include Supabase configuration status', async () => {
      // Set environment variable
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDatabaseSuccess([])),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await healthGet(request as any)
      const result = await response.json()

      expectSuccessResponse(result)
      expect(result.data.services.supabase.url).toBe('configured')
    })

    it('should indicate when Supabase URL is not configured', async () => {
      // Remove environment variable
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDatabaseSuccess([])),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await healthGet(request as any)
      const result = await response.json()

      expectSuccessResponse(result)
      expect(result.data.services.supabase.url).toBe('not configured')

      // Restore for other tests
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    })

    it('should measure response time accurately', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation(() => {
          // Simulate delay
          return new Promise(resolve => {
            setTimeout(() => resolve(mockDatabaseSuccess([])), 100)
          })
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await healthGet(request as any)
      const result = await response.json()

      expectSuccessResponse(result)
      expect(result.data.services.database.responseTime).toBeGreaterThanOrEqual(100)
    })

    it('should include system information', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDatabaseSuccess([])),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await healthGet(request as any)
      const result = await response.json()

      expectSuccessResponse(result)
      expect(result.data.system).toHaveProperty('nodeVersion')
      expect(result.data.system).toHaveProperty('platform')
      expect(result.data.system.memory).toHaveProperty('used')
      expect(result.data.system.memory).toHaveProperty('total')
      expect(typeof result.data.system.memory.used).toBe('number')
      expect(typeof result.data.system.memory.total).toBe('number')
    })

    it('should handle unexpected errors gracefully', async () => {
      // Force an error by making from throw
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const request = createMockRequest('GET')
      const response = await healthGet(request as any)
      const result = await response.json()

      expect(response.status).toBe(503)
      expect(result.success).toBe(false)
      expect(result.status).toBe('unhealthy')
      expect(result.error).toBe('Unexpected error')
    })

    it('should include version information', async () => {
      // Mock package version
      process.env.npm_package_version = '1.2.3'

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDatabaseSuccess([])),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await healthGet(request as any)
      const result = await response.json()

      expectSuccessResponse(result)
      expect(result.data.version).toBe('1.2.3')

      // Cleanup
      delete process.env.npm_package_version
    })

    it('should use default version when package version not available', async () => {
      delete process.env.npm_package_version

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDatabaseSuccess([])),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await healthGet(request as any)
      const result = await response.json()

      expectSuccessResponse(result)
      expect(result.data.version).toBe('1.0.0')
    })
  })
})