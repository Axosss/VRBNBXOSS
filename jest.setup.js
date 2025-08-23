import '@testing-library/jest-dom'

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Note: Supabase mocks are handled per-test to avoid module resolution issues

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

// Global test setup
global.fetch = jest.fn()

// Suppress console errors during tests unless explicitly testing error conditions
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'