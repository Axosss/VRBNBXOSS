-- Row Level Security (RLS) policies for VRBNBXOSS
-- Implementing database-level authorization

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleanings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  -- Profiles policies
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

  -- Apartments policies
  DROP POLICY IF EXISTS "Owners can access their apartments" ON apartments;
  CREATE POLICY "Owners can access their apartments" 
  ON apartments FOR ALL 
  USING (auth.uid() = owner_id);

  DROP POLICY IF EXISTS "Cleaners can view apartments they clean" ON apartments;
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
  DROP POLICY IF EXISTS "Owners can access their reservations" ON reservations;
  CREATE POLICY "Owners can access their reservations" 
  ON reservations FOR ALL 
  USING (auth.uid() = owner_id);

  DROP POLICY IF EXISTS "Cleaners can view reservations for apartments they clean" ON reservations;
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
  DROP POLICY IF EXISTS "Owners can access their guests" ON guests;
  CREATE POLICY "Owners can access their guests" 
  ON guests FOR ALL 
  USING (auth.uid() = owner_id);

  -- Cleanings policies
  DROP POLICY IF EXISTS "Owners can manage cleanings" ON cleanings;
  CREATE POLICY "Owners can manage cleanings" 
  ON cleanings FOR ALL 
  USING (
    auth.uid() IN (
      SELECT owner_id FROM apartments WHERE id = apartment_id
    )
  );

  DROP POLICY IF EXISTS "Cleaners can view and update their cleanings" ON cleanings;
  CREATE POLICY "Cleaners can view and update their cleanings" 
  ON cleanings FOR SELECT 
  USING (
    cleaner_id IN (
      SELECT id FROM cleaners WHERE owner_id = auth.uid()
    )
  );

  DROP POLICY IF EXISTS "Cleaners can update their cleanings" ON cleanings;
  CREATE POLICY "Cleaners can update their cleanings" 
  ON cleanings FOR UPDATE 
  USING (
    cleaner_id IN (
      SELECT id FROM cleaners WHERE owner_id = auth.uid()
    )
  );

  -- Cleaners policies
  DROP POLICY IF EXISTS "Owners can manage their cleaners" ON cleaners;
  CREATE POLICY "Owners can manage their cleaners" 
  ON cleaners FOR ALL 
  USING (auth.uid() = owner_id);
END $$;

-- Storage policies (handle if bucket exists)
DO $$ 
BEGIN
  -- Create bucket if not exists
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('apartment-photos', 'apartment-photos', true)
  ON CONFLICT (id) DO NOTHING;

  -- Drop and recreate storage policies
  DROP POLICY IF EXISTS "Users can view apartment photos" ON storage.objects;
  CREATE POLICY "Users can view apartment photos" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'apartment-photos');

  DROP POLICY IF EXISTS "Authenticated users can upload apartment photos" ON storage.objects;
  CREATE POLICY "Authenticated users can upload apartment photos" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'apartment-photos' 
    AND auth.role() = 'authenticated'
  );

  DROP POLICY IF EXISTS "Users can update their apartment photos" ON storage.objects;
  CREATE POLICY "Users can update their apartment photos" 
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'apartment-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

  DROP POLICY IF EXISTS "Users can delete their apartment photos" ON storage.objects;
  CREATE POLICY "Users can delete their apartment photos" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'apartment-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
END $$;