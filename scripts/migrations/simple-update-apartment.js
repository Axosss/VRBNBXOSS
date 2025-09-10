const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Create client without type safety to bypass TypeScript validation
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false
  }
});

async function updateAllApartmentsToBoccador() {
  const boccadorId = '63561c46-cbc2-4340-8f51-9c798fde898a';
  const userId = '4997ae03-f7fe-4709-b885-2b78c435d6cc';
  
  try {
    console.log('Updating all reservations to Boccador apartment...\n');
    
    // Get count before update
    const { count: beforeCount } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .neq('apartment_id', boccadorId);
    
    console.log(`Found ${beforeCount} reservations not yet assigned to Boccador`);
    
    // Update ALL reservations to Boccador - bypassing type validation
    const { data, error, count } = await supabase
      .from('reservations')
      .update({ 
        apartment_id: boccadorId,
        updated_at: new Date().toISOString()
      })
      .eq('owner_id', userId)
      .select();
    
    if (error) {
      console.error('Update error:', error);
      return;
    }
    
    console.log(`\n✅ Successfully updated ${data?.length || 0} reservations!`);
    
    // Verify the final state
    const { data: finalData, count: totalCount } = await supabase
      .from('reservations')
      .select('apartment_id', { count: 'exact' })
      .eq('owner_id', userId);
    
    const boccadorCount = finalData?.filter(r => r.apartment_id === boccadorId).length || 0;
    const otherCount = finalData?.filter(r => r.apartment_id !== boccadorId).length || 0;
    
    console.log(`\n📊 Final Status:`);
    console.log(`- Total reservations: ${totalCount}`);
    console.log(`- Boccador apartment: ${boccadorCount} reservations`);
    console.log(`- Other apartments: ${otherCount} reservations`);
    
    if (otherCount === 0) {
      console.log('\n🎉 All reservations are now assigned to Boccador!');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateAllApartmentsToBoccador();