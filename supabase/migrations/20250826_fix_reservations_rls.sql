-- Fix RLS policies for reservations table to avoid infinite recursion

-- Drop existing policies for reservations
DROP POLICY IF EXISTS "reservations_select_policy" ON reservations;
DROP POLICY IF EXISTS "reservations_insert_policy" ON reservations;
DROP POLICY IF EXISTS "reservations_update_policy" ON reservations;
DROP POLICY IF EXISTS "reservations_delete_policy" ON reservations;
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can delete their own reservations" ON reservations;

-- Create simple policies for reservations
CREATE POLICY "reservations_select_policy" ON reservations
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "reservations_insert_policy" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "reservations_update_policy" ON reservations
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "reservations_delete_policy" ON reservations
  FOR DELETE USING (auth.uid() = owner_id);