-- Add floor_plan column to apartments table
ALTER TABLE apartments 
ADD COLUMN IF NOT EXISTS floor_plan TEXT;

-- Add comment for documentation
COMMENT ON COLUMN apartments.floor_plan IS 'URL to the floor plan image or PDF stored in Supabase Storage';