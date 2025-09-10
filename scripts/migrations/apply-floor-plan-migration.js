const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyMigration() {
  console.log('Applying floor_plan migration...')

  try {
    // Check if column already exists
    const { data: columns, error: columnsError } = await supabase.rpc('get_columns', {
      table_name: 'apartments',
      schema_name: 'public'
    }).select('column_name')

    if (columnsError) {
      // Column might not exist, let's try to add it
      console.log('Checking column existence failed, attempting to add...')
    }

    // Add floor_plan column
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE apartments ADD COLUMN IF NOT EXISTS floor_plan TEXT;`
    })

    if (error) {
      // Try alternative approach using raw SQL through API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          sql: `ALTER TABLE apartments ADD COLUMN IF NOT EXISTS floor_plan TEXT;`
        })
      })

      if (!response.ok) {
        console.log('Migration might already be applied or using alternative method...')
        // Try to just verify the column exists by selecting from apartments
        const { data: test, error: testError } = await supabase
          .from('apartments')
          .select('id, floor_plan')
          .limit(1)
        
        if (testError && testError.message.includes('floor_plan')) {
          console.error('❌ Failed to add floor_plan column:', testError)
          return
        } else {
          console.log('✅ floor_plan column already exists or was added successfully')
        }
      } else {
        console.log('✅ floor_plan column added successfully')
      }
    } else {
      console.log('✅ floor_plan column added successfully')
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

applyMigration()