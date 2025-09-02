const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAndUpdateAllReservations() {
  const boccadorId = '63561c46-cbc2-4340-8f51-9c798fde898a';
  const userId = '4997ae03-f7fe-4709-b885-2b78c435d6cc';
  
  try {
    // First, get ALL reservations including those with invalid status
    const { data: allReservations, error: fetchError } = await supabase
      .from('reservations')
      .select('id, apartment_id, status')
      .eq('owner_id', userId);
    
    if (fetchError) {
      console.error('Error fetching reservations:', fetchError);
      return;
    }
    
    console.log(`Found ${allReservations.length} total reservations`);
    
    // Fix invalid status values first
    const invalidStatusReservations = allReservations.filter(r => r.status === 'checked_out');
    console.log(`Found ${invalidStatusReservations.length} reservations with invalid 'checked_out' status`);
    
    // Update invalid statuses to 'completed'
    if (invalidStatusReservations.length > 0) {
      for (const reservation of invalidStatusReservations) {
        const { error: statusError } = await supabase
          .from('reservations')
          .update({ status: 'completed' })
          .eq('id', reservation.id);
        
        if (statusError) {
          console.error(`Failed to fix status for ${reservation.id}:`, statusError);
        } else {
          console.log(`✓ Fixed status for reservation ${reservation.id}`);
        }
      }
    }
    
    // Now update ALL reservations to Boccador apartment
    console.log('\nUpdating all reservations to Boccador apartment...');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const reservation of allReservations) {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ apartment_id: boccadorId })
        .eq('id', reservation.id);
      
      if (updateError) {
        console.error(`✗ Failed to update ${reservation.id}:`, updateError.message);
        failCount++;
      } else {
        console.log(`✓ Updated reservation ${reservation.id}`);
        successCount++;
      }
    }
    
    console.log(`\n✅ Summary:`);
    console.log(`- Successfully updated: ${successCount} reservations`);
    console.log(`- Failed: ${failCount} reservations`);
    
    // Verify the final state
    const { data: verifyData, error: verifyError } = await supabase
      .from('reservations')
      .select('apartment_id')
      .eq('owner_id', userId);
    
    if (!verifyError && verifyData) {
      const boccadorCount = verifyData.filter(r => r.apartment_id === boccadorId).length;
      const otherCount = verifyData.filter(r => r.apartment_id !== boccadorId).length;
      
      console.log(`\n📊 Final Status:`);
      console.log(`- Boccador apartment: ${boccadorCount} reservations`);
      console.log(`- Other apartments: ${otherCount} reservations`);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixAndUpdateAllReservations();