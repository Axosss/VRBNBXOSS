-- Comprehensive RLS fix to avoid infinite recursion between related tables
-- This script drops all existing policies and recreates them with proper structure

-- Disable RLS temporarily to clean up
ALTER TABLE apartments DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE cleanings DISABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for apartments
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'apartments'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON apartments';
    END LOOP;
END $$;

-- Drop ALL existing policies for reservations
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'reservations'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON reservations';
    END LOOP;
END $$;

-- Drop ALL existing policies for guests
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'guests'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON guests';
    END LOOP;
END $$;

-- Drop ALL existing policies for cleanings
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'cleanings'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON cleanings';
    END LOOP;
END $$;

-- Drop ALL existing policies for cleaners
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'cleaners'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON cleaners';
    END LOOP;
END $$;

-- Create simple, non-recursive policies for apartments
CREATE POLICY "apartments_owner_select" ON apartments
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "apartments_owner_insert" ON apartments
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "apartments_owner_update" ON apartments
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "apartments_owner_delete" ON apartments
  FOR DELETE USING (owner_id = auth.uid());

-- Create simple, non-recursive policies for reservations
CREATE POLICY "reservations_owner_select" ON reservations
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "reservations_owner_insert" ON reservations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "reservations_owner_update" ON reservations
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "reservations_owner_delete" ON reservations
  FOR DELETE USING (owner_id = auth.uid());

-- Create simple, non-recursive policies for guests
CREATE POLICY "guests_owner_select" ON guests
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "guests_owner_insert" ON guests
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "guests_owner_update" ON guests
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "guests_owner_delete" ON guests
  FOR DELETE USING (owner_id = auth.uid());

-- Create simple, non-recursive policies for cleanings
-- Cleanings don't have owner_id, they access through apartments
CREATE POLICY "cleanings_owner_select" ON cleanings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM apartments 
      WHERE apartments.id = cleanings.apartment_id 
      AND apartments.owner_id = auth.uid()
    )
  );

CREATE POLICY "cleanings_owner_insert" ON cleanings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM apartments 
      WHERE apartments.id = cleanings.apartment_id 
      AND apartments.owner_id = auth.uid()
    )
  );

CREATE POLICY "cleanings_owner_update" ON cleanings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM apartments 
      WHERE apartments.id = cleanings.apartment_id 
      AND apartments.owner_id = auth.uid()
    )
  );

CREATE POLICY "cleanings_owner_delete" ON cleanings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM apartments 
      WHERE apartments.id = cleanings.apartment_id 
      AND apartments.owner_id = auth.uid()
    )
  );

-- Create simple, non-recursive policies for cleaners
CREATE POLICY "cleaners_owner_select" ON cleaners
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "cleaners_owner_insert" ON cleaners
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "cleaners_owner_update" ON cleaners
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "cleaners_owner_delete" ON cleaners
  FOR DELETE USING (owner_id = auth.uid());

-- Re-enable RLS
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleanings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;

-- Verify the fix
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('apartments', 'reservations', 'guests', 'cleanings', 'cleaners')
ORDER BY tablename, policyname;