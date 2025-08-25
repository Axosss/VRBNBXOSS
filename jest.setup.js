require('@testing-library/jest-dom')

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

// Conditionally suppress console output during tests while preserving security logs
const originalConsole = { ...console }
global.console = {
  ...console,
  error: jest.fn((message, ...args) => {
    // Preserve security-related error messages
    if (typeof message === 'string' && 
        (message.toLowerCase().includes('security') || 
         message.toLowerCase().includes('auth') ||
         message.toLowerCase().includes('unauthorized') ||
         message.toLowerCase().includes('forbidden'))) {
      originalConsole.error(message, ...args)
    }
  }),
  warn: jest.fn((message, ...args) => {
    // Preserve security-related warning messages  
    if (typeof message === 'string' && 
        (message.toLowerCase().includes('security') || 
         message.toLowerCase().includes('auth') ||
         message.toLowerCase().includes('deprecated') ||
         message.toLowerCase().includes('vulnerability'))) {
      originalConsole.warn(message, ...args)
    }
  }),
}

// Mock environment variables with clearly fake test-only values
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://TEST-ONLY.supabase.local'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'TEST-ANON-KEY-NOT-REAL'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'TEST-SERVICE-KEY-NOT-REAL'