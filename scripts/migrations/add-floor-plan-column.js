const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function addFloorPlanColumn() {
  console.log('Adding floor_plan column to apartments table...')

  try {
    // First, let's check the current structure
    const { data: apartments, error: checkError } = await supabase
      .from('apartments')
      .select('*')
      .limit(1)

    if (checkError) {
      console.error('Error checking apartments table:', checkError)
      return
    }

    console.log('Current apartment structure (sample):', apartments[0] ? Object.keys(apartments[0]) : 'No apartments found')

    // Since we can't directly alter the table via Supabase client,
    // we'll need to use the Supabase dashboard or direct database access
    console.log('\n⚠️  Please run the following SQL in your Supabase SQL Editor:')
    console.log('----------------------------------------')
    console.log('ALTER TABLE apartments ADD COLUMN IF NOT EXISTS floor_plan TEXT;')
    console.log('----------------------------------------')
    console.log('\nOr go to: https://supabase.com/dashboard/project/fdfigwvbawfaefmdhxaj/sql/new')
    console.log('and run the SQL command above.')

    // Let's test if floor_plan already exists by trying to update a dummy value
    const testId = apartments[0]?.id
    if (testId) {
      const { error: updateError } = await supabase
        .from('apartments')
        .update({ floor_plan: null })
        .eq('id', testId)

      if (!updateError) {
        console.log('\n✅ Good news! The floor_plan column already exists!')
      } else if (updateError.message.includes('floor_plan')) {
        console.log('\n❌ The floor_plan column does not exist yet. Please add it using the SQL command above.')
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

addFloorPlanColumn()