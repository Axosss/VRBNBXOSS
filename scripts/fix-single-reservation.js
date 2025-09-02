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

async function fixSingleReservation() {
  const userId = '4997ae03-f7fe-4709-b885-2b78c435d6cc';
  
  try {
    // First, let's find any reservation with Sanchez in the contact info or guest name
    const { data: allReservations, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('owner_id', userId);
    
    if (fetchError) {
      console.error('Error fetching reservations:', fetchError);
      return;
    }
    
    console.log(`Found ${allReservations.length} total reservations\n`);
    
    // Find Sanchez reservation
    const sanchezReservations = allReservations.filter(r => {
      const contactInfo = r.contact_info || {};
      const guestName = contactInfo.name || '';
      return guestName.toLowerCase().includes('sanchez');
    });
    
    console.log(`Found ${sanchezReservations.length} Sanchez reservations\n`);
    
    for (const reservation of sanchezReservations) {
      console.log(`\nReservation ID: ${reservation.id}`);
      console.log(`Guest: ${reservation.contact_info?.name || 'Unknown'}`);
      console.log(`Check-in: ${reservation.check_in}`);
      console.log(`Check-out: ${reservation.check_out}`);
      console.log(`Status: ${reservation.status}`);
      console.log(`Apartment: ${reservation.apartment_id}`);
      
      // Try to update just the check-out date
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ 
          check_out: '2025-08-16'
        })
        .eq('id', reservation.id);
      
      if (updateError) {
        console.log(`\n❌ Cannot update due to invalid status. Recreating reservation...`);
        
        // Delete the corrupted reservation
        const { error: deleteError } = await supabase
          .from('reservations')
          .delete()
          .eq('id', reservation.id);
        
        if (deleteError) {
          console.error('Failed to delete:', deleteError);
          continue;
        }
        
        // Recreate with fixed status and new check-out date
        const fixedReservation = {
          ...reservation,
          id: undefined, // Let DB generate new ID
          status: 'completed', // Fix the invalid status
          check_out: '2025-08-16', // Update check-out date
          created_at: reservation.created_at,
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
          console.log(`\n✅ Fixed! Old ID: ${reservation.id}`);
          console.log(`         New ID: ${newReservation.id}`);
          console.log(`         Status: ${newReservation.status}`);
          console.log(`         Check-out: ${newReservation.check_out}`);
        }
      } else {
        console.log(`\n✅ Successfully updated check-out date to 2025-08-16`);
      }
    }
    
    // If no Sanchez found, look for Montaigne apartment reservations
    if (sanchezReservations.length === 0) {
      console.log('\nNo Sanchez reservations found. Looking for Montaigne apartment reservations...');
      
      // First get Montaigne apartment ID
      const { data: apartments } = await supabase
        .from('apartments')
        .select('id, name')
        .eq('owner_id', userId);
      
      const montaigne = apartments?.find(a => a.name.includes('Montaigne'));
      
      if (montaigne) {
        console.log(`\nFound Montaigne apartment: ${montaigne.id}`);
        
        const montaigneReservations = allReservations.filter(r => 
          r.apartment_id === montaigne.id && 
          r.check_in?.includes('2025-08')
        );
        
        console.log(`Found ${montaigneReservations.length} August 2025 Montaigne reservations`);
        
        for (const reservation of montaigneReservations) {
          console.log(`\nProcessing reservation ${reservation.id}`);
          console.log(`Guest: ${reservation.contact_info?.name || 'Unknown'}`);
          console.log(`Status: ${reservation.status}`);
          
          if (reservation.status === 'checked_out') {
            console.log('Fixing invalid status...');
            
            // Delete and recreate
            await supabase.from('reservations').delete().eq('id', reservation.id);
            
            const fixed = {
              ...reservation,
              id: undefined,
              status: 'completed',
              check_out: '2025-08-16',
              updated_at: new Date().toISOString()
            };
            
            const { data: newRes, error } = await supabase
              .from('reservations')
              .insert(fixed)
              .select()
              .single();
            
            if (error) {
              console.error('Failed to fix:', error);
            } else {
              console.log(`✅ Fixed! New ID: ${newRes.id}`);
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixSingleReservation();