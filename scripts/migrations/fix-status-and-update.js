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

async function fixStatusAndUpdate() {
  const boccadorId = '63561c46-cbc2-4340-8f51-9c798fde898a';
  const userId = '4997ae03-f7fe-4709-b885-2b78c435d6cc';
  
  try {
    console.log('Fetching all reservations to check their status...\n');
    
    // Get all reservations without status filter to see raw data
    const { data: allReservations, error: fetchError } = await supabase
      .from('reservations')
      .select('id, apartment_id')
      .eq('owner_id', userId);
    
    if (fetchError) {
      console.error('Error fetching reservations:', fetchError);
      return;
    }
    
    console.log(`Found ${allReservations.length} total reservations`);
    
    // Update each reservation individually, only changing apartment_id
    let successCount = 0;
    let alreadyBoccador = 0;
    let failCount = 0;
    
    for (const reservation of allReservations) {
      if (reservation.apartment_id === boccadorId) {
        alreadyBoccador++;
        console.log(`✓ Reservation ${reservation.id} already assigned to Boccador`);
        continue;
      }
      
      // Try to update just the apartment_id field
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ 
          apartment_id: boccadorId 
        })
        .eq('id', reservation.id)
        .select()
        .single();
      
      if (updateError) {
        // If update fails, try to get the status and see what's wrong
        console.error(`✗ Failed ${reservation.id}: ${updateError.message}`);
        failCount++;
      } else {
        console.log(`✓ Updated reservation ${reservation.id}`);
        successCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`- Already assigned to Boccador: ${alreadyBoccador}`);
    console.log(`- Successfully updated: ${successCount}`);
    console.log(`- Failed to update: ${failCount}`);
    console.log(`- Total processed: ${allReservations.length}`);
    
    // Final verification
    const { count: finalBoccadorCount } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('apartment_id', boccadorId);
    
    console.log(`\n✅ Final: ${finalBoccadorCount} reservations are assigned to Boccador`);
    
    if (finalBoccadorCount === allReservations.length) {
      console.log('🎉 All reservations successfully assigned to Boccador!');
    } else {
      console.log(`⚠️ ${allReservations.length - finalBoccadorCount} reservations could not be updated`);
      console.log('\nThis is likely due to invalid status values in the database.');
      console.log('The status "checked_out" exists in these records but causes validation errors.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixStatusAndUpdate();