-- Initial schema for VRBNBXOSS
-- Creating all core tables with proper constraints and relationships

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE reservation_status AS ENUM (
  'draft', 
  'pending', 
  'confirmed', 
  'checked_in', 
  'checked_out', 
  'cancelled', 
  'archived'
);

CREATE TYPE platform_type AS ENUM (
  'airbnb',
  'vrbo', 
  'direct',
  'booking_com'
);

CREATE TYPE apartment_status AS ENUM (
  'active',
  'maintenance', 
  'inactive'
);

CREATE TYPE cleaning_status AS ENUM (
  'needed',
  'scheduled',
  'in_progress',
  'completed',
  'verified',
  'cancelled'
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'cleaner', 'admin')),
  timezone TEXT DEFAULT 'UTC',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apartments table
CREATE TABLE apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address JSONB NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  bedrooms INTEGER CHECK (bedrooms >= 0),
  bathrooms DECIMAL CHECK (bathrooms >= 0),
  amenities TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  access_codes JSONB, -- Encrypted access codes (WiFi, door codes, etc.)
  status apartment_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guests table
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  id_document TEXT, -- Encrypted ID information
  address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations table
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id),
  platform platform_type NOT NULL,
  platform_reservation_id TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_count INTEGER NOT NULL CHECK (guest_count > 0),
  total_price DECIMAL NOT NULL CHECK (total_price >= 0),
  cleaning_fee DECIMAL DEFAULT 0 CHECK (cleaning_fee >= 0),
  platform_fee DECIMAL DEFAULT 0 CHECK (platform_fee >= 0),
  currency TEXT DEFAULT 'USD',
  status reservation_status DEFAULT 'confirmed',
  notes TEXT,
  contact_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (check_out > check_in),
  CONSTRAINT valid_guest_capacity CHECK (guest_count <= (SELECT capacity FROM apartments WHERE id = apartment_id))
);

-- Cleaners table
CREATE TABLE cleaners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  rate DECIMAL CHECK (rate >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cleanings table
CREATE TABLE cleanings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  cleaner_id UUID REFERENCES cleaners(id),
  reservation_id UUID REFERENCES reservations(id),
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration INTERVAL,
  status cleaning_status DEFAULT 'scheduled',
  instructions TEXT,
  supplies JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_apartments_owner_id ON apartments(owner_id);
CREATE INDEX idx_apartments_status ON apartments(status);

CREATE INDEX idx_reservations_owner_id ON reservations(owner_id);
CREATE INDEX idx_reservations_apartment_id ON reservations(apartment_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_platform ON reservations(platform);

CREATE INDEX idx_guests_owner_id ON guests(owner_id);
CREATE INDEX idx_guests_email ON guests(email);

CREATE INDEX idx_cleanings_apartment_id ON cleanings(apartment_id);
CREATE INDEX idx_cleanings_cleaner_id ON cleanings(cleaner_id);
CREATE INDEX idx_cleanings_scheduled_date ON cleanings(scheduled_date);
CREATE INDEX idx_cleanings_status ON cleanings(status);

CREATE INDEX idx_cleaners_owner_id ON cleaners(owner_id);

-- Unique constraints
CREATE UNIQUE INDEX idx_platform_reservation_unique ON reservations(platform, platform_reservation_id) 
WHERE platform_reservation_id IS NOT NULL;

-- Comment on tables
COMMENT ON TABLE profiles IS 'User profiles extending auth.users with role and settings';
COMMENT ON TABLE apartments IS 'Property information with encrypted access codes';
COMMENT ON TABLE reservations IS 'Bookings across platforms with overlap prevention';
COMMENT ON TABLE guests IS 'Guest information with encrypted sensitive data';
COMMENT ON TABLE cleanings IS 'Cleaning schedules linked to reservations';
COMMENT ON TABLE cleaners IS 'Cleaner profiles and rates';