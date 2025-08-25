-- VRBNBXOSS Database Schema
-- Complete database setup for rental property management platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE apartment_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE reservation_platform AS ENUM ('airbnb', 'vrbo', 'direct');
CREATE TYPE cleaning_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE user_role AS ENUM ('owner', 'cleaner', 'admin');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'owner',
    timezone TEXT DEFAULT 'UTC',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create apartments table
CREATE TABLE IF NOT EXISTS public.apartments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address JSONB NOT NULL DEFAULT '{}',
    capacity INTEGER NOT NULL DEFAULT 2,
    bedrooms INTEGER NOT NULL DEFAULT 1,
    bathrooms NUMERIC(3,1) NOT NULL DEFAULT 1,
    square_feet INTEGER,
    amenities TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    main_photo TEXT,
    access_codes JSONB DEFAULT '{}',
    status apartment_status DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT apartments_capacity_check CHECK (capacity > 0),
    CONSTRAINT apartments_bedrooms_check CHECK (bedrooms >= 0),
    CONSTRAINT apartments_bathrooms_check CHECK (bathrooms >= 0)
);

-- Create indexes for apartments
CREATE INDEX idx_apartments_owner_id ON public.apartments(owner_id);
CREATE INDEX idx_apartments_status ON public.apartments(status);
CREATE INDEX idx_apartments_created_at ON public.apartments(created_at DESC);

-- Create guests table
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    id_document TEXT,
    address JSONB DEFAULT '{}',
    notes TEXT,
    blacklisted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for guests
CREATE INDEX idx_guests_owner_id ON public.guests(owner_id);
CREATE INDEX idx_guests_email ON public.guests(email);
CREATE INDEX idx_guests_blacklisted ON public.guests(blacklisted);

-- Create reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
    platform reservation_platform NOT NULL,
    platform_reservation_id TEXT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guest_count INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2),
    cleaning_fee DECIMAL(10,2),
    platform_fee DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    status reservation_status DEFAULT 'pending',
    notes TEXT,
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT reservations_dates_check CHECK (check_out > check_in),
    CONSTRAINT reservations_guest_count_check CHECK (guest_count > 0),
    CONSTRAINT reservations_price_check CHECK (total_price >= 0)
);

-- Create indexes for reservations
CREATE INDEX idx_reservations_apartment_id ON public.reservations(apartment_id);
CREATE INDEX idx_reservations_owner_id ON public.reservations(owner_id);
CREATE INDEX idx_reservations_guest_id ON public.reservations(guest_id);
CREATE INDEX idx_reservations_check_in ON public.reservations(check_in);
CREATE INDEX idx_reservations_check_out ON public.reservations(check_out);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_platform ON public.reservations(platform);

-- Create cleaners table
CREATE TABLE IF NOT EXISTS public.cleaners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    rate DECIMAL(10,2),
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for cleaners
CREATE INDEX idx_cleaners_owner_id ON public.cleaners(owner_id);
CREATE INDEX idx_cleaners_active ON public.cleaners(active);

-- Create cleanings table
CREATE TABLE IF NOT EXISTS public.cleanings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
    cleaner_id UUID REFERENCES public.cleaners(id) ON DELETE SET NULL,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMPTZ NOT NULL,
    duration INTERVAL DEFAULT '2 hours',
    status cleaning_status DEFAULT 'scheduled',
    instructions TEXT,
    supplies JSONB DEFAULT '{}',
    payment_amount DECIMAL(10,2),
    paid BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for cleanings
CREATE INDEX idx_cleanings_apartment_id ON public.cleanings(apartment_id);
CREATE INDEX idx_cleanings_cleaner_id ON public.cleanings(cleaner_id);
CREATE INDEX idx_cleanings_reservation_id ON public.cleanings(reservation_id);
CREATE INDEX idx_cleanings_scheduled_date ON public.cleanings(scheduled_date);
CREATE INDEX idx_cleanings_status ON public.cleanings(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apartments_updated_at BEFORE UPDATE ON public.apartments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON public.guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleaners_updated_at BEFORE UPDATE ON public.cleaners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleanings_updated_at BEFORE UPDATE ON public.cleanings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Apartments policies
CREATE POLICY "Users can view their own apartments" ON public.apartments
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own apartments" ON public.apartments
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own apartments" ON public.apartments
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own apartments" ON public.apartments
    FOR DELETE USING (auth.uid() = owner_id);

-- Guests policies
CREATE POLICY "Users can view their own guests" ON public.guests
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own guests" ON public.guests
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own guests" ON public.guests
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own guests" ON public.guests
    FOR DELETE USING (auth.uid() = owner_id);

-- Reservations policies
CREATE POLICY "Users can view their own reservations" ON public.reservations
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own reservations" ON public.reservations
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own reservations" ON public.reservations
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own reservations" ON public.reservations
    FOR DELETE USING (auth.uid() = owner_id);

-- Cleaners policies
CREATE POLICY "Users can view their own cleaners" ON public.cleaners
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own cleaners" ON public.cleaners
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own cleaners" ON public.cleaners
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own cleaners" ON public.cleaners
    FOR DELETE USING (auth.uid() = owner_id);

-- Cleanings policies
CREATE POLICY "Users can view cleanings for their apartments" ON public.cleanings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.apartments
            WHERE apartments.id = cleanings.apartment_id
            AND apartments.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert cleanings for their apartments" ON public.cleanings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.apartments
            WHERE apartments.id = cleanings.apartment_id
            AND apartments.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update cleanings for their apartments" ON public.cleanings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.apartments
            WHERE apartments.id = cleanings.apartment_id
            AND apartments.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete cleanings for their apartments" ON public.cleanings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.apartments
            WHERE apartments.id = cleanings.apartment_id
            AND apartments.owner_id = auth.uid()
        )
    );

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, role)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url',
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'owner')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create view for apartment statistics
CREATE OR REPLACE VIEW apartment_stats AS
SELECT 
    a.id as apartment_id,
    a.owner_id,
    a.name,
    COUNT(DISTINCT r.id) as total_reservations,
    COUNT(DISTINCT CASE WHEN r.status = 'confirmed' THEN r.id END) as confirmed_reservations,
    COUNT(DISTINCT CASE WHEN r.check_in <= CURRENT_DATE AND r.check_out >= CURRENT_DATE THEN r.id END) as current_reservations,
    COALESCE(SUM(r.total_price), 0) as total_revenue,
    COALESCE(AVG(r.guest_count), 0) as avg_guest_count
FROM public.apartments a
LEFT JOIN public.reservations r ON a.id = r.apartment_id
GROUP BY a.id, a.owner_id, a.name;

-- Grant permissions on the view
GRANT SELECT ON apartment_stats TO authenticated;

-- Create function to check availability
CREATE OR REPLACE FUNCTION check_apartment_availability(
    p_apartment_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.reservations
        WHERE apartment_id = p_apartment_id
        AND status NOT IN ('cancelled')
        AND (p_exclude_reservation_id IS NULL OR id != p_exclude_reservation_id)
        AND (
            (check_in <= p_check_in AND check_out > p_check_in) OR
            (check_in < p_check_out AND check_out >= p_check_out) OR
            (check_in >= p_check_in AND check_out <= p_check_out)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_access_codes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.access_codes IS NOT NULL THEN
        -- In production, use proper encryption
        -- This is a placeholder for demonstration
        NEW.access_codes = NEW.access_codes;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply encryption trigger to apartments
CREATE TRIGGER encrypt_apartment_access_codes
    BEFORE INSERT OR UPDATE ON public.apartments
    FOR EACH ROW EXECUTE FUNCTION encrypt_access_codes();

-- Insert sample amenities reference (optional)
CREATE TABLE IF NOT EXISTS public.amenities_reference (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    category TEXT
);

INSERT INTO public.amenities_reference (name, icon, category) VALUES
    ('WiFi', 'wifi', 'essentials'),
    ('Kitchen', 'utensils', 'essentials'),
    ('Parking', 'car', 'essentials'),
    ('Air Conditioning', 'snowflake', 'comfort'),
    ('Heating', 'thermometer', 'comfort'),
    ('TV', 'tv', 'entertainment'),
    ('Washer', 'shirt', 'amenities'),
    ('Dryer', 'wind', 'amenities'),
    ('Pool', 'waves', 'amenities'),
    ('Gym', 'dumbbell', 'amenities'),
    ('Elevator', 'arrow-up-down', 'building'),
    ('Wheelchair Accessible', 'accessibility', 'building')
ON CONFLICT (name) DO NOTHING;

-- Create storage bucket for apartment photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('apartments', 'apartments', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for apartment photos bucket
CREATE POLICY "Users can upload apartment photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'apartments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view apartment photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'apartments');

CREATE POLICY "Users can delete their apartment photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'apartments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'VRBNBXOSS database schema created successfully!';
END $$;