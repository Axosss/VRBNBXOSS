const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCleaningCreation() {
  console.log('Testing cleaning creation without conflicts...\n')

  try {
    // Get the first apartment
    const { data: apartments, error: apartmentError } = await supabase
      .from('apartments')
      .select('id, name')
      .limit(1)

    if (apartmentError || !apartments?.length) {
      console.error('No apartments found')
      return
    }

    const apartment = apartments[0]
    console.log(`Using apartment: ${apartment.name} (${apartment.id})\n`)

    // Test 1: Create a cleaning in the past
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 7) // 7 days ago
    const pastEnd = new Date(pastDate)
    pastEnd.setHours(pastEnd.getHours() + 3)

    console.log('Test 1: Creating cleaning in the past...')
    const { data: pastCleaning, error: pastError } = await supabase
      .from('cleanings')
      .insert({
        apartment_id: apartment.id,
        owner_id: '4997ae03-f7fe-4709-b885-2b78c435d6cc', // Your user ID
        scheduled_start: pastDate.toISOString(),
        scheduled_end: pastEnd.toISOString(),
        cleaning_type: 'standard',
        status: 'completed',
        instructions: 'Test cleaning in the past',
        cost: 50,
        currency: 'EUR'
      })
      .select()
      .single()

    if (pastError) {
      console.error('❌ Failed to create past cleaning:', pastError.message)
    } else {
      console.log('✅ Past cleaning created successfully:', {
        id: pastCleaning.id,
        scheduled: pastCleaning.scheduled_start
      })
    }

    // Test 2: Create overlapping cleanings (should work now)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7) // 7 days from now
    futureDate.setHours(10, 0, 0, 0)
    const futureEnd = new Date(futureDate)
    futureEnd.setHours(13, 0, 0, 0)

    console.log('\nTest 2: Creating first future cleaning...')
    const { data: cleaning1, error: error1 } = await supabase
      .from('cleanings')
      .insert({
        apartment_id: apartment.id,
        owner_id: '4997ae03-f7fe-4709-b885-2b78c435d6cc',
        scheduled_start: futureDate.toISOString(),
        scheduled_end: futureEnd.toISOString(),
        cleaning_type: 'deep',
        status: 'scheduled',
        instructions: 'First overlapping cleaning',
        cost: 75,
        currency: 'EUR'
      })
      .select()
      .single()

    if (error1) {
      console.error('❌ Failed to create first cleaning:', error1.message)
    } else {
      console.log('✅ First cleaning created:', {
        id: cleaning1.id,
        scheduled: cleaning1.scheduled_start
      })
    }

    console.log('\nTest 3: Creating overlapping cleaning (should work now)...')
    const overlapStart = new Date(futureDate)
    overlapStart.setHours(11, 0, 0, 0) // Overlaps with first cleaning
    const overlapEnd = new Date(futureDate)
    overlapEnd.setHours(14, 0, 0, 0)

    const { data: cleaning2, error: error2 } = await supabase
      .from('cleanings')
      .insert({
        apartment_id: apartment.id,
        owner_id: '4997ae03-f7fe-4709-b885-2b78c435d6cc',
        scheduled_start: overlapStart.toISOString(),
        scheduled_end: overlapEnd.toISOString(),
        cleaning_type: 'standard',
        status: 'scheduled',
        instructions: 'Overlapping cleaning - should work now',
        cost: 60,
        currency: 'EUR'
      })
      .select()
      .single()

    if (error2) {
      console.error('❌ Failed to create overlapping cleaning:', error2.message)
    } else {
      console.log('✅ Overlapping cleaning created successfully:', {
        id: cleaning2.id,
        scheduled: cleaning2.scheduled_start
      })
    }

    // Clean up test data
    console.log('\nCleaning up test data...')
    const idsToDelete = [pastCleaning?.id, cleaning1?.id, cleaning2?.id].filter(Boolean)
    
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('cleanings')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) {
        console.error('Failed to clean up:', deleteError.message)
      } else {
        console.log('✅ Test cleanings deleted')
      }
    }

    console.log('\n✅ All tests completed! Cleanings are now purely informational.')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testCleaningCreation()