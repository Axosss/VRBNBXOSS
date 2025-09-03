/**
 * Database Types (snake_case)
 * Ces types représentent exactement la structure des données
 * telles qu'elles sont stockées dans PostgreSQL/Supabase
 */

// ============================================
// TABLE: reservations
// ============================================
export interface ReservationDB {
  id: string
  apartment_id: string
  owner_id: string
  guest_id: string | null
  platform: 'airbnb' | 'vrbo' | 'direct' | 'booking_com'
  platform_reservation_id: string | null
  check_in: string  // DATE in DB, string from Supabase
  check_out: string // DATE in DB, string from Supabase
  guest_count: number
  total_price: number
  cleaning_fee: number | null
  platform_fee: number | null
  currency: string
  status: 'confirmed' | 'cancelled'
  notes: string | null
  contact_info: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// ============================================
// TABLE: apartments
// ============================================
export interface ApartmentDB {
  id: string
  owner_id: string
  name: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  } // JSONB in DB
  capacity: number
  bedrooms: number | null
  bathrooms: number | null
  amenities: string[] // TEXT[] in DB
  photos: string[] // TEXT[] in DB - Note: Frontend expects objects, needs transformation
  access_codes: Record<string, unknown> | null // JSONB in DB
  floor_plan: string | null // TEXT in DB - URL to floor plan image/PDF
  square_feet: number | null
  notes: string | null
  status: 'active' | 'maintenance' | 'inactive'
  created_at: string
  updated_at: string
}

// ============================================
// TABLE: cleanings
// ============================================
export interface CleaningDB {
  id: string
  apartment_id: string
  cleaner_id: string | null
  reservation_id: string | null
  scheduled_date: string // TIMESTAMPTZ in DB
  duration: string | null // INTERVAL in DB (e.g., "02:00:00")
  status: 'needed' | 'scheduled' | 'in_progress' | 'completed' | 'verified' | 'cancelled'
  instructions: string | null
  supplies: Record<string, unknown> | null // JSONB in DB
  created_at: string
  updated_at: string
}

// ============================================
// TABLE: guests
// ============================================
export interface GuestDB {
  id: string
  owner_id: string
  name: string
  email: string | null
  phone: string | null
  id_document: string | null // Encrypted in DB
  address: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  } | null // JSONB in DB
  created_at: string
  updated_at: string
}

// ============================================
// TABLE: cleaners
// ============================================
export interface CleanerDB {
  id: string
  owner_id: string
  name: string
  email: string | null
  phone: string | null
  rate: number | null
  created_at: string
  updated_at: string
}

// ============================================
// TABLE: profiles
// ============================================
export interface ProfileDB {
  id: string // References auth.users(id)
  full_name: string | null
  avatar_url: string | null
  role: 'owner' | 'cleaner' | 'admin'
  timezone: string
  settings: Record<string, unknown> // JSONB in DB
  created_at: string
  updated_at: string
}

// ============================================
// Join Types (when using .select() with relations)
// ============================================
export interface ReservationWithRelationsDB extends ReservationDB {
  apartment?: ApartmentDB
  guest?: GuestDB
}

export interface CleaningWithRelationsDB extends CleaningDB {
  apartment?: ApartmentDB
  cleaner?: CleanerDB
  reservation?: ReservationDB
}

// ============================================
// Type Guards
// ============================================
export function isReservationDB(obj: any): obj is ReservationDB {
  return obj && typeof obj.apartment_id === 'string' && typeof obj.check_in === 'string'
}

export function isApartmentDB(obj: any): obj is ApartmentDB {
  return obj && typeof obj.owner_id === 'string' && obj.address && typeof obj.capacity === 'number'
}

export function isCleaningDB(obj: any): obj is CleaningDB {
  return obj && typeof obj.apartment_id === 'string' && typeof obj.scheduled_date === 'string'
}

export function isGuestDB(obj: any): obj is GuestDB {
  return obj && typeof obj.owner_id === 'string' && typeof obj.name === 'string'
}

export function isCleanerDB(obj: any): obj is CleanerDB {
  return obj && typeof obj.owner_id === 'string' && typeof obj.name === 'string'
}