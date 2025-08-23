import { createClient } from '@supabase/supabase-js'

// Mock Supabase client for testing
export const createMockSupabaseClient = () => {
  const mockAuth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    getSession: jest.fn(),
    exchangeCodeForSession: jest.fn(),
  }

  // Create a shared query builder instance that can be configured by tests
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  }
  
  const mockFrom = jest.fn(() => mockQueryBuilder)

  const mockStorage = {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
      list: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  }

  return {
    auth: mockAuth,
    from: mockFrom,
    storage: mockStorage,
    // Expose the query builder for tests to configure
    _mockQueryBuilder: mockQueryBuilder,
  }
}

// Test data factories
export const createTestUser = (overrides = {}) => ({
  id: 'TEST-USER-ID-FAKE',
  email: 'test-user-fake@example-not-real.com',
  user_metadata: {
    full_name: 'TEST USER FAKE',
  },
  ...overrides,
})

export const createTestProfile = (overrides = {}) => ({
  id: 'test-user-id',
  full_name: 'Test User',
  avatar_url: null,
  role: 'owner',
  timezone: 'UTC',
  settings: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestApartment = (overrides = {}) => ({
  id: 'test-apartment-id',
  owner_id: 'test-user-id',
  name: 'Test Apartment',
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'US',
  },
  capacity: 4,
  bedrooms: 2,
  bathrooms: 1.5,
  amenities: ['wifi', 'kitchen'],
  photos: [],
  access_codes: {
    wifi: { network: 'TEST-NETWORK-FAKE', password: 'TEST-PASSWORD-NOT-REAL' },
    door: 'TEST-CODE-0000',
  },
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestGuest = (overrides = {}) => ({
  id: 'TEST-GUEST-ID-FAKE',
  owner_id: 'TEST-USER-ID-FAKE',
  name: 'TEST GUEST FAKE',
  email: 'guest-fake@example-not-real.com',
  phone: '+1-000-000-0000',
  id_document: null,
  address: {
    street: '456 Guest St',
    city: 'Guest City',
    state: 'GS',
    zipCode: '67890',
    country: 'US',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestReservation = (overrides = {}) => ({
  id: 'test-reservation-id',
  apartment_id: 'test-apartment-id',
  owner_id: 'test-user-id',
  guest_id: 'test-guest-id',
  platform: 'airbnb' as const,
  platform_reservation_id: 'AIRBNB123',
  check_in: '2024-12-25',
  check_out: '2024-12-28',
  guest_count: 2,
  total_price: 450.00,
  cleaning_fee: 50.00,
  platform_fee: 25.00,
  currency: 'USD',
  status: 'confirmed',
  notes: 'Test reservation',
  contact_info: {
    phone: '+1234567890',
    email: 'guest@example.com',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestCleaner = (overrides = {}) => ({
  id: 'test-cleaner-id',
  owner_id: 'test-user-id',
  name: 'Test Cleaner',
  email: 'cleaner@example.com',
  phone: '+1987654321',
  rate: 25.00,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestCleaning = (overrides = {}) => ({
  id: 'test-cleaning-id',
  apartment_id: 'test-apartment-id',
  cleaner_id: 'test-cleaner-id',
  reservation_id: 'test-reservation-id',
  scheduled_date: '2024-12-28T11:00:00Z',
  duration: '02:00:00',
  status: 'scheduled',
  instructions: 'Standard cleaning',
  supplies: {
    provided: ['towels', 'sheets'],
    bring: ['vacuum', 'cleaning_supplies'],
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Mock Next.js Request/Response
export const createMockRequest = (method: string, body?: any, searchParams?: Record<string, string>) => {
  const url = new URL('http://localhost:3000/api/test')
  
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  return {
    method,
    url: url.toString(),
    json: jest.fn().mockResolvedValue(body),
    headers: new Headers(),
    cookies: {
      get: jest.fn(),
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    },
  }
}

export const createMockResponse = () => ({
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
})

// Assertion helpers
export const expectSuccessResponse = (response: any) => {
  expect(response).toHaveProperty('success', true)
  expect(response).toHaveProperty('data')
}

export const expectErrorResponse = (response: any, statusCode?: number) => {
  expect(response).toHaveProperty('success', false)
  expect(response).toHaveProperty('error')
  if (statusCode) {
    expect(response).toHaveProperty('statusCode', statusCode)
  }
}

export const expectValidationError = (response: any) => {
  expect(response).toHaveProperty('success', false)
  expect(response).toHaveProperty('statusCode', 400)
  expect(typeof response.error).toBe('string')
  expect(response.error.length).toBeGreaterThan(0)
}

// Database test utilities
export const mockDatabaseError = (message: string) => ({
  error: new Error(message),
  data: null,
})

export const mockDatabaseSuccess = (data: any) => ({
  error: null,
  data,
  count: Array.isArray(data) ? data.length : null,
})