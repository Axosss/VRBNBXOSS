-- Fix INSERT policies to have proper WITH CHECK conditions

-- Fix apartments INSERT policy
DROP POLICY IF EXISTS "apartments_owner_insert" ON apartments;
CREATE POLICY "apartments_owner_insert" ON apartments
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Fix reservations INSERT policy
DROP POLICY IF EXISTS "reservations_owner_insert" ON reservations;
CREATE POLICY "reservations_owner_insert" ON reservations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Fix guests INSERT policy
DROP POLICY IF EXISTS "guests_owner_insert" ON guests;
CREATE POLICY "guests_owner_insert" ON guests
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Fix cleaners INSERT policy
DROP POLICY IF EXISTS "cleaners_owner_insert" ON cleaners;
CREATE POLICY "cleaners_owner_insert" ON cleaners
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Fix cleanings INSERT policy
DROP POLICY IF EXISTS "cleanings_owner_insert" ON cleanings;
CREATE POLICY "cleanings_owner_insert" ON cleanings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM apartments 
      WHERE apartments.id = cleanings.apartment_id 
      AND apartments.owner_id = auth.uid()
    )
  );

-- Verify the fix
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('apartments', 'reservations', 'guests', 'cleanings', 'cleaners')
AND cmd = 'INSERT'
ORDER BY tablename, policyname;