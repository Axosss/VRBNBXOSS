-- Create the floor-plans bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types)
VALUES (
  'floor-plans',
  'floor-plans', 
  true, -- Public bucket for floor plans
  false,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own floor plans" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own floor plans" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own floor plans" ON storage.objects;
DROP POLICY IF EXISTS "Public can view floor plans" ON storage.objects;

-- Create RLS policies for floor-plans bucket
-- Allow authenticated users to upload their own floor plans
CREATE POLICY "Users can upload their own floor plans"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'floor-plans' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own floor plans
CREATE POLICY "Users can update their own floor plans"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'floor-plans' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own floor plans
CREATE POLICY "Users can delete their own floor plans"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'floor-plans' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public to view floor plans (since apartments are displayed publicly)
CREATE POLICY "Public can view floor plans"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'floor-plans');