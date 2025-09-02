const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupStorageBuckets() {
  console.log('Setting up storage buckets...')

  try {
    // Create apartment-photos bucket if it doesn't exist
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }

    const bucketExists = existingBuckets?.some(bucket => bucket.name === 'apartment-photos')

    if (!bucketExists) {
      console.log('Creating apartment-photos bucket...')
      
      const { data, error } = await supabase.storage.createBucket('apartment-photos', {
        public: true, // Make bucket public for photo URLs
        fileSizeLimit: 5242880, // 5MB limit
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      })

      if (error) {
        console.error('Error creating bucket:', error)
      } else {
        console.log('✅ apartment-photos bucket created successfully')
      }
    } else {
      console.log('✅ apartment-photos bucket already exists')
      
      // Update bucket settings to ensure it's public
      const { error: updateError } = await supabase.storage.updateBucket('apartment-photos', {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      })
      
      if (updateError) {
        console.error('Error updating bucket settings:', updateError)
      } else {
        console.log('✅ Bucket settings updated')
      }
    }

    // Create floor-plans bucket for apartment floor plans
    const floorPlanBucketExists = existingBuckets?.some(bucket => bucket.name === 'floor-plans')

    if (!floorPlanBucketExists) {
      console.log('Creating floor-plans bucket...')
      
      const { data, error } = await supabase.storage.createBucket('floor-plans', {
        public: true,
        fileSizeLimit: 10485760, // 10MB limit for floor plans
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      })

      if (error) {
        console.error('Error creating floor-plans bucket:', error)
      } else {
        console.log('✅ floor-plans bucket created successfully')
      }
    } else {
      console.log('✅ floor-plans bucket already exists')
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

setupStorageBuckets()