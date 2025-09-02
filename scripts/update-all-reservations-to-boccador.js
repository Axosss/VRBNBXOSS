const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateAllReservationsToBoccador() {
  const boccadorId = '63561c46-cbc2-4340-8f51-9c798fde898a';
  const userId = '4997ae03-f7fe-4709-b885-2b78c435d6cc';
  
  try {
    // First, get all reservations for this user
    const { data: reservations, error: fetchError } = await supabase
      .from('reservations')
      .select('id, apartment_id, guest_id')
      .eq('owner_id', userId);
    
    if (fetchError) {
      console.error('Error fetching reservations:', fetchError);
      return;
    }
    
    console.log(`Found ${reservations.length} reservations to update`);
    
    // Update all reservations to Boccador apartment
    const { data, error } = await supabase
      .from('reservations')
      .update({ apartment_id: boccadorId })
      .eq('owner_id', userId);
    
    if (error) {
      console.error('Error updating reservations:', error);
      return;
    }
    
    console.log('✅ Successfully updated all reservations to Boccador apartment');
    
    // Verify the update
    const { data: updatedReservations, error: verifyError } = await supabase
      .from('reservations')
      .select('id, apartment_id')
      .eq('owner_id', userId)
      .eq('apartment_id', boccadorId);
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      return;
    }
    
    console.log(`✅ Verified: ${updatedReservations.length} reservations are now assigned to Boccador`);
    
    // Show count by apartment
    const { data: stats, error: statsError } = await supabase
      .from('reservations')
      .select('apartment_id')
      .eq('owner_id', userId);
    
    if (!statsError) {
      const counts = stats.reduce((acc, r) => {
        acc[r.apartment_id] = (acc[r.apartment_id] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\nReservations by apartment:');
      console.log(`Boccador (${boccadorId}): ${counts[boccadorId] || 0}`);
      
      // Show if any other apartments still have reservations
      Object.keys(counts).forEach(aptId => {
        if (aptId !== boccadorId) {
          console.log(`Other apartment (${aptId}): ${counts[aptId]}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateAllReservationsToBoccador();