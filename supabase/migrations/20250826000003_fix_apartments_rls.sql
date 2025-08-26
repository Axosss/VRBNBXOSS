-- Fix infinite recursion in apartments RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own apartments" ON apartments;
DROP POLICY IF EXISTS "Users can create their own apartments" ON apartments;  
DROP POLICY IF EXISTS "Users can update their own apartments" ON apartments;
DROP POLICY IF EXISTS "Users can delete their own apartments" ON apartments;

-- Create simplified RLS policies without recursion
CREATE POLICY "apartments_select_policy" ON apartments
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "apartments_insert_policy" ON apartments
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "apartments_update_policy" ON apartments
  FOR UPDATE USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "apartments_delete_policy" ON apartments
  FOR DELETE USING (auth.uid() = owner_id);