/**
 * @jest-environment node
 */

import {
  AppError,
  createErrorResponse,
  createSuccessResponse,
  formatDate,
  formatDateRange,
  getDaysBetween,
  isDateRangeOverlapping,
  formatCurrency,
  calculateOccupancyRate,
  hashPassword,
  verifyPassword,
  buildQueryString,
  getFileExtension,
  isValidImageType,
  generateStoragePath,
  isValidUUID,
  sanitizeInput,
  getPlatformDisplayName,
  getStatusDisplayName,
  getStatusColor,
} from '@/lib/utils'

describe('Utility Functions', () => {
  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
    })

    it('should create error with custom values', () => {
      const error = new AppError('Test error', 400, false)
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(false)
    })

    it('should extend Error correctly', () => {
      const error = new AppError('Test error')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
    })
  })

  describe('createErrorResponse', () => {
    it('should handle AppError correctly', () => {
      const appError = new AppError('Custom error', 400)
      const response = createErrorResponse(appError)
      
      expect(response).toEqual({
        success: false,
        error: 'Custom error',
        statusCode: 400,
      })
    })

    it('should handle generic Error', () => {
      const error = new Error('Generic error')
      const response = createErrorResponse(error)
      
      expect(response).toEqual({
        success: false,
        error: 'Generic error',
        statusCode: 500,
      })
    })

    it('should handle unknown error types', () => {
      const response = createErrorResponse('String error')
      
      expect(response).toEqual({
        success: false,
        error: 'An error occurred',
        statusCode: 500,
      })
    })

    it('should use custom default message', () => {
      const response = createErrorResponse('String error', 'Custom default')
      
      expect(response).toEqual({
        success: false,
        error: 'Custom default',
        statusCode: 500,
      })
    })
  })

  describe('createSuccessResponse', () => {
    it('should create success response with data only', () => {
      const data = { id: 1, name: 'test' }
      const response = createSuccessResponse(data)
      
      expect(response).toEqual({
        success: true,
        data,
      })
    })

    it('should create success response with data and message', () => {
      const data = { id: 1, name: 'test' }
      const message = 'Operation successful'
      const response = createSuccessResponse(data, message)
      
      expect(response).toEqual({
        success: true,
        data,
        message,
      })
    })
  })

  describe('formatDate', () => {
    const testDate = new Date('2024-12-25T10:30:00Z')

    it('should format Date object with default options', () => {
      const result = formatDate(testDate)
      expect(result).toBe('Dec 25, 2024')
    })

    it('should format date string', () => {
      const result = formatDate('2024-12-25')
      expect(result).toBe('Dec 25, 2024')
    })

    it('should respect custom options', () => {
      const result = formatDate(testDate, { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      expect(result).toBe('Wednesday, December 25, 2024')
    })
  })

  describe('formatDateRange', () => {
    it('should format date range', () => {
      const startDate = '2024-12-25'
      const endDate = '2024-12-28'
      const result = formatDateRange(startDate, endDate)
      expect(result).toBe('Dec 25, 2024 - Dec 28, 2024')
    })

    it('should handle Date objects', () => {
      const startDate = new Date('2024-12-25')
      const endDate = new Date('2024-12-28')
      const result = formatDateRange(startDate, endDate)
      expect(result).toBe('Dec 25, 2024 - Dec 28, 2024')
    })
  })

  describe('getDaysBetween', () => {
    it('should calculate days between dates', () => {
      const startDate = '2024-12-25'
      const endDate = '2024-12-28'
      const result = getDaysBetween(startDate, endDate)
      expect(result).toBe(3)
    })

    it('should handle Date objects', () => {
      const startDate = new Date('2024-12-25')
      const endDate = new Date('2024-12-28')
      const result = getDaysBetween(startDate, endDate)
      expect(result).toBe(3)
    })

    it('should handle same date', () => {
      const date = '2024-12-25'
      const result = getDaysBetween(date, date)
      expect(result).toBe(0)
    })

    it('should handle reversed dates (absolute difference)', () => {
      const result = getDaysBetween('2024-12-28', '2024-12-25')
      expect(result).toBe(3)
    })
  })

  describe('isDateRangeOverlapping', () => {
    it('should detect overlapping ranges', () => {
      const result = isDateRangeOverlapping(
        '2024-12-25', '2024-12-28',
        '2024-12-27', '2024-12-30'
      )
      expect(result).toBe(true)
    })

    it('should detect non-overlapping ranges', () => {
      const result = isDateRangeOverlapping(
        '2024-12-25', '2024-12-28',
        '2024-12-29', '2024-12-31'
      )
      expect(result).toBe(false)
    })

    it('should handle touching ranges as non-overlapping', () => {
      const result = isDateRangeOverlapping(
        '2024-12-25', '2024-12-28',
        '2024-12-28', '2024-12-31'
      )
      expect(result).toBe(false)
    })

    it('should handle Date objects', () => {
      const result = isDateRangeOverlapping(
        new Date('2024-12-25'), new Date('2024-12-28'),
        new Date('2024-12-27'), new Date('2024-12-30')
      )
      expect(result).toBe(true)
    })
  })

  describe('formatCurrency', () => {
    it('should format USD currency by default', () => {
      const result = formatCurrency(123.45)
      expect(result).toBe('$123.45')
    })

    it('should format different currencies', () => {
      const result = formatCurrency(123.45, 'EUR', 'de-DE')
      // Euro formatting can vary, just check it includes the amount and currency
      expect(result).toMatch(/123[,.]45.*€/)
    })

    it('should handle zero amount', () => {
      const result = formatCurrency(0)
      expect(result).toBe('$0.00')
    })

    it('should handle large amounts', () => {
      const result = formatCurrency(1234567.89)
      expect(result).toBe('$1,234,567.89')
    })
  })

  describe('calculateOccupancyRate', () => {
    it('should calculate occupancy rate correctly', () => {
      const result = calculateOccupancyRate(75, 100)
      expect(result).toBe(75)
    })

    it('should handle zero total nights', () => {
      const result = calculateOccupancyRate(10, 0)
      expect(result).toBe(0)
    })

    it('should round to 2 decimal places', () => {
      const result = calculateOccupancyRate(1, 3)
      expect(result).toBe(33.33)
    })

    it('should handle 100% occupancy', () => {
      const result = calculateOccupancyRate(30, 30)
      expect(result).toBe(100)
    })
  })

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(50)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'testpassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)
      
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(wrongPassword, hash)
      
      expect(isValid).toBe(false)
    })
  })

  describe('buildQueryString', () => {
    it('should build query string from object', () => {
      const params = {
        page: 2,
        limit: 10,
        search: 'test',
      }
      const result = buildQueryString(params)
      expect(result).toBe('?page=2&limit=10&search=test')
    })

    it('should handle empty object', () => {
      const result = buildQueryString({})
      expect(result).toBe('')
    })

    it('should skip undefined/null/empty values', () => {
      const params = {
        page: 1,
        search: '',
        filter: undefined,
        sort: null,
        active: true,
      }
      const result = buildQueryString(params)
      expect(result).toBe('?page=1&active=true')
    })

    it('should handle boolean values', () => {
      const params = {
        active: true,
        hidden: false,
      }
      const result = buildQueryString(params)
      expect(result).toBe('?active=true&hidden=false')
    })
  })

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('image.jpg')).toBe('jpg')
      expect(getFileExtension('document.pdf')).toBe('pdf')
      expect(getFileExtension('archive.tar.gz')).toBe('gz')
    })

    it('should handle files without extension', () => {
      expect(getFileExtension('filename')).toBe('')
    })

    it('should handle hidden files', () => {
      expect(getFileExtension('.gitignore')).toBe('')
      expect(getFileExtension('.env.local')).toBe('local')
    })
  })

  describe('isValidImageType', () => {
    it('should accept valid image types', () => {
      expect(isValidImageType('image/jpeg')).toBe(true)
      expect(isValidImageType('image/jpg')).toBe(true)
      expect(isValidImageType('image/png')).toBe(true)
      expect(isValidImageType('image/webp')).toBe(true)
    })

    it('should reject invalid types', () => {
      expect(isValidImageType('text/plain')).toBe(false)
      expect(isValidImageType('application/pdf')).toBe(false)
      expect(isValidImageType('video/mp4')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(isValidImageType('IMAGE/JPEG')).toBe(true)
      expect(isValidImageType('Image/PNG')).toBe(true)
    })
  })

  describe('generateStoragePath', () => {
    it('should generate storage path', () => {
      const userId = 'user123'
      const category = 'apartments'
      const filename = 'image.jpg'
      
      const result = generateStoragePath(userId, category, filename)
      
      expect(result).toMatch(/^user123\/apartments\/\d+\.jpg$/)
    })

    it('should preserve file extension', () => {
      const result = generateStoragePath('user', 'cat', 'file.png')
      expect(result.endsWith('.png')).toBe(true)
    })

    it('should include timestamp', () => {
      const before = Date.now()
      const result = generateStoragePath('user', 'cat', 'file.jpg')
      const after = Date.now()
      
      const timestamp = parseInt(result.split('/')[2].split('.')[0])
      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })
  })

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false)
      expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false) // Too short
      expect(isValidUUID('550e8400-e29b-41d4-a716-4466554400000')).toBe(false) // Too long
      expect(isValidUUID('')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
    })
  })

  describe('sanitizeInput', () => {
    it('should sanitize HTML characters', () => {
      const input = '<script>alert("xss")</script>'
      const result = sanitizeInput(input)
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    })

    it('should handle all special characters', () => {
      const input = '<>&"\''
      const result = sanitizeInput(input)
      expect(result).toBe('&lt;&gt;&amp;&quot;&#39;')
    })

    it('should trim whitespace', () => {
      const input = '  test  '
      const result = sanitizeInput(input)
      expect(result).toBe('test')
    })

    it('should preserve normal text', () => {
      const input = 'This is normal text'
      const result = sanitizeInput(input)
      expect(result).toBe('This is normal text')
    })
  })

  describe('getPlatformDisplayName', () => {
    it('should return correct display names', () => {
      expect(getPlatformDisplayName('airbnb')).toBe('Airbnb')
      expect(getPlatformDisplayName('vrbo')).toBe('VRBO')
      expect(getPlatformDisplayName('direct')).toBe('Direct Booking')
      expect(getPlatformDisplayName('booking_com')).toBe('Booking.com')
    })

    it('should return original string for unknown platforms', () => {
      expect(getPlatformDisplayName('unknown')).toBe('unknown')
    })
  })

  describe('getStatusDisplayName', () => {
    it('should format status names correctly', () => {
      expect(getStatusDisplayName('checked_in')).toBe('Checked In')
      expect(getStatusDisplayName('in_progress')).toBe('In Progress')
      expect(getStatusDisplayName('active')).toBe('Active')
    })

    it('should handle single word statuses', () => {
      expect(getStatusDisplayName('confirmed')).toBe('Confirmed')
    })
  })

  describe('getStatusColor', () => {
    it('should return correct colors for reservation statuses', () => {
      expect(getStatusColor('confirmed')).toBe('bg-green-100 text-green-800')
      expect(getStatusColor('cancelled')).toBe('bg-red-100 text-red-800')
      expect(getStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800')
    })

    it('should return correct colors for cleaning statuses', () => {
      expect(getStatusColor('scheduled')).toBe('bg-blue-100 text-blue-800')
      expect(getStatusColor('completed')).toBe('bg-green-100 text-green-800')
      expect(getStatusColor('needed')).toBe('bg-orange-100 text-orange-800')
    })

    it('should return correct colors for apartment statuses', () => {
      expect(getStatusColor('active')).toBe('bg-green-100 text-green-800')
      expect(getStatusColor('maintenance')).toBe('bg-orange-100 text-orange-800')
      expect(getStatusColor('inactive')).toBe('bg-red-100 text-red-800')
    })

    it('should return default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('bg-gray-100 text-gray-800')
    })
  })
})