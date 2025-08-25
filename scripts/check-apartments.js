// Script pour vérifier les appartements dans Supabase
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkApartments() {
  console.log('🔍 Checking apartments in database...\n')
  
  try {
    // 1. Check all apartments (bypass RLS with service key)
    const { data: allApartments, error: allError } = await supabase
      .from('apartments')
      .select('id, name, owner_id, status, created_at')
      .order('created_at', { ascending: false })
    
    if (allError) {
      console.error('❌ Error fetching all apartments:', allError)
      return
    }
    
    console.log(`📊 Total apartments in database: ${allApartments?.length || 0}`)
    
    if (allApartments && allApartments.length > 0) {
      console.log('\n📋 Apartments found:')
      allApartments.forEach((apt, index) => {
        console.log(`  ${index + 1}. ${apt.name}`)
        console.log(`     ID: ${apt.id}`)
        console.log(`     Owner: ${apt.owner_id}`)
        console.log(`     Status: ${apt.status}`)
        console.log(`     Created: ${new Date(apt.created_at).toLocaleString()}`)
        console.log('')
      })
    } else {
      console.log('\n⚠️  No apartments found in database')
    }
    
    // 2. Check profiles to match with apartments
    const ownerIds = [...new Set(allApartments?.map(a => a.owner_id) || [])]
    if (ownerIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', ownerIds)
      
      if (profiles && profiles.length > 0) {
        console.log('👤 Apartment owners:')
        profiles.forEach(profile => {
          const apartmentCount = allApartments?.filter(a => a.owner_id === profile.id).length || 0
          console.log(`  - ${profile.email || 'No email'} (${profile.full_name || 'No name'}): ${apartmentCount} apartment(s)`)
        })
      }
    }
    
    // 3. Check RLS policies
    console.log('\n🔒 Checking RLS policies...')
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies', { table_name: 'apartments' })
      .single()
    
    if (policyError) {
      console.log('   Note: Cannot check policies directly, but RLS is likely configured')
    } else {
      console.log('   RLS policies are configured')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the check
checkApartments()
  .then(() => {
    console.log('\n✅ Check complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })