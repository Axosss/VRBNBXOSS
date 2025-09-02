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

async function fixSanchezReservation() {
  const userId = '4997ae03-f7fe-4709-b885-2b78c435d6cc';
  
  try {
    // Find Sanchez reservation
    const { data: reservations, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('owner_id', userId);
    
    if (fetchError) {
      console.error('Error fetching reservations:', fetchError);
      return;
    }
    
    const sanchezReservation = reservations.find(r => {
      const contactInfo = r.contact_info || {};
      const guestName = contactInfo.name || '';
      return guestName.toLowerCase().includes('sanchez');
    });
    
    if (!sanchezReservation) {
      console.log('No Sanchez reservation found');
      return;
    }
    
    console.log('Found Sanchez reservation:');
    console.log(`ID: ${sanchezReservation.id}`);
    console.log(`Current dates: ${sanchezReservation.check_in} to ${sanchezReservation.check_out}`);
    console.log(`Status: ${sanchezReservation.status}`);
    
    // Update to have check-in on 16/08 and check-out on 31/08
    const newCheckIn = '2025-08-16';
    const newCheckOut = '2025-08-31';
    
    console.log(`\nUpdating to: ${newCheckIn} to ${newCheckOut}`);
    
    // Try direct update first
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ 
        check_in: newCheckIn,
        check_out: newCheckOut,
        updated_at: new Date().toISOString()
      })
      .eq('id', sanchezReservation.id);
    
    if (updateError) {
      console.log('\nDirect update failed. Recreating reservation...');
      
      // Delete the old one
      const { error: deleteError } = await supabase
        .from('reservations')
        .delete()
        .eq('id', sanchezReservation.id);
      
      if (deleteError) {
        console.error('Failed to delete:', deleteError);
        return;
      }
      
      // Create new one with correct dates and status
      const fixedReservation = {
        ...sanchezReservation,
        id: undefined,
        check_in: newCheckIn,
        check_out: newCheckOut,
        status: sanchezReservation.status === 'checked_out' ? 'completed' : sanchezReservation.status,
        created_at: sanchezReservation.created_at,
        updated_at: new Date().toISOString()
      };
      
      const { data: newReservation, error: createError } = await supabase
        .from('reservations')
        .insert(fixedReservation)
        .select()
        .single();
      
      if (createError) {
        console.error('Failed to recreate:', createError);
      } else {
        console.log('\n✅ Successfully fixed Sanchez reservation!');
        console.log(`New ID: ${newReservation.id}`);
        console.log(`Dates: ${newReservation.check_in} to ${newReservation.check_out}`);
        console.log(`Status: ${newReservation.status}`);
      }
    } else {
      console.log('\n✅ Successfully updated Sanchez reservation dates!');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixSanchezReservation();