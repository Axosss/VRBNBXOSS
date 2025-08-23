-- Row Level Security (RLS) policies for VRBNBXOSS
-- Implementing database-level authorization

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleanings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Apartments policies
CREATE POLICY "Owners can access their apartments" 
ON apartments FOR ALL 
USING (auth.uid() = owner_id);

CREATE POLICY "Cleaners can view apartments they clean" 
ON apartments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM cleanings c 
    JOIN cleaners cl ON c.cleaner_id = cl.id 
    WHERE c.apartment_id = apartments.id 
    AND cl.owner_id = auth.uid()
  )
);

-- Reservations policies
CREATE POLICY "Owners can access their reservations" 
ON reservations FOR ALL 
USING (auth.uid() = owner_id);

CREATE POLICY "Cleaners can view reservations for apartments they clean" 
ON reservations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM cleanings c 
    JOIN cleaners cl ON c.cleaner_id = cl.id 
    WHERE c.reservation_id = reservations.id 
    AND cl.owner_id = auth.uid()
  )
);

-- Guests policies
CREATE POLICY "Owners can access their guests" 
ON guests FOR ALL 
USING (auth.uid() = owner_id);

-- Cleanings policies
CREATE POLICY "Owners can access cleanings for their apartments" 
ON cleanings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM apartments a 
    WHERE a.id = cleanings.apartment_id 
    AND a.owner_id = auth.uid()
  )
);

CREATE POLICY "Cleaners can access their assigned cleanings" 
ON cleanings FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM cleaners cl 
    WHERE cl.id = cleanings.cleaner_id 
    AND cl.owner_id = auth.uid()
  )
);

CREATE POLICY "Cleaners can update their assigned cleanings" 
ON cleanings FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM cleaners cl 
    WHERE cl.id = cleanings.cleaner_id 
    AND cl.owner_id = auth.uid()
  )
);

-- Cleaners policies
CREATE POLICY "Owners can access their cleaners" 
ON cleaners FOR ALL 
USING (auth.uid() = owner_id);

-- Storage policies for apartment photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('apartment-photos', 'apartment-photos', true);

CREATE POLICY "Users can view apartment photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'apartment-photos');

CREATE POLICY "Authenticated users can upload apartment photos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'apartment-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their apartment photos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'apartment-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their apartment photos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'apartment-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);