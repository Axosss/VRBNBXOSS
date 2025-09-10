-- ⚠️ IMPORTANT: RUN THIS IN SUPABASE SQL EDITOR NOW
-- Go to: https://supabase.com/dashboard/project/fdfigwvbawfaefmdhxaj/sql/new
-- Paste this entire SQL and click "Run"

-- First, ensure RLS is enabled
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Drop any existing public policies to avoid conflicts
DROP POLICY IF EXISTS "Public users can view apartment details" ON apartments;
DROP POLICY IF EXISTS "Public users can view reservation dates" ON reservations;
DROP POLICY IF EXISTS "public_view_apartments" ON apartments;
DROP POLICY IF EXISTS "public_view_reservations" ON reservations;
DROP POLICY IF EXISTS "Anyone can view apartments" ON apartments;
DROP POLICY IF EXISTS "Anyone can view reservations" ON reservations;

-- Create new public viewing policies with unique names
CREATE POLICY "allow_public_apartment_read" 
  ON apartments 
  FOR SELECT 
  USING (true);

CREATE POLICY "allow_public_reservation_read" 
  ON reservations 
  FOR SELECT 
  USING (true);

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('apartments', 'reservations')
  AND policyname LIKE '%public%'
ORDER BY tablename, policyname;