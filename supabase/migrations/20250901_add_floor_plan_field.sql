-- Add floor_plan field to apartments table
ALTER TABLE apartments 
ADD COLUMN IF NOT EXISTS floor_plan TEXT;