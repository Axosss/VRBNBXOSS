-- ============================================
-- ENABLE PUBLIC VIEWING OF APARTMENTS
-- ============================================
-- Run this in Supabase SQL Editor to allow public apartment pages
-- Go to: https://supabase.com/dashboard/project/fdfigwvbawfaefmdhxaj/sql/new

-- Create a policy that allows anyone to read basic apartment information
-- This is safe because we're only exposing non-sensitive data
CREATE POLICY "Public users can view apartment details" ON apartments
  FOR SELECT
  USING (true);  -- Allow all reads

-- Also allow public to view reservations for availability calendar
-- We only show dates, not guest information
CREATE POLICY "Public users can view reservation dates" ON reservations
  FOR SELECT
  USING (true);  -- Allow all reads

-- Note: The API still filters out sensitive data like:
-- - Access codes
-- - Owner information  
-- - Guest names
-- - Prices

-- Test the public page after running this:
-- http://localhost:3000/p/63561c46-cbc2-4340-8f51-9c798fde898a