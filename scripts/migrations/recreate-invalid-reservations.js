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

async function recreateInvalidReservations() {
  const boccadorId = '63561c46-cbc2-4340-8f51-9c798fde898a';
  const userId = '4997ae03-f7fe-4709-b885-2b78c435d6cc';
  
  try {
    console.log('Step 1: Fetching all reservations to identify problematic ones...\n');
    
    // Get all reservations
    const { data: allReservations, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('owner_id', userId);
    
    if (fetchError) {
      console.error('Error fetching reservations:', fetchError);
      return;
    }
    
    console.log(`Found ${allReservations.length} total reservations`);
    
    // Separate good and problematic reservations
    const goodReservations = [];
    const problematicReservations = [];
    
    for (const reservation of allReservations) {
      // Try to update to identify problematic ones
      const { error: testError } = await supabase
        .from('reservations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', reservation.id);
      
      if (testError && testError.message.includes('checked_out')) {
        problematicReservations.push(reservation);
      } else {
        goodReservations.push(reservation);
      }
    }
    
    console.log(`\n📊 Analysis:`);
    console.log(`- Good reservations: ${goodReservations.length}`);
    console.log(`- Problematic reservations (with invalid status): ${problematicReservations.length}`);
    
    if (problematicReservations.length === 0) {
      console.log('\n✅ No problematic reservations found!');
      return;
    }
    
    console.log('\nStep 2: Backing up problematic reservations...');
    
    // Save problematic reservations to a backup file
    const fs = require('fs');
    const backupPath = path.join(__dirname, 'backup-reservations.json');
    fs.writeFileSync(backupPath, JSON.stringify(problematicReservations, null, 2));
    console.log(`✓ Backed up ${problematicReservations.length} reservations to ${backupPath}`);
    
    console.log('\nStep 3: Deleting problematic reservations...');
    
    // Delete problematic reservations
    for (const reservation of problematicReservations) {
      const { error: deleteError } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservation.id);
      
      if (deleteError) {
        console.error(`✗ Failed to delete ${reservation.id}:`, deleteError.message);
      } else {
        console.log(`✓ Deleted reservation ${reservation.id}`);
      }
    }
    
    console.log('\nStep 4: Recreating reservations with valid status and Boccador apartment...');
    
    // Recreate reservations with fixed data
    const recreatedReservations = [];
    for (const reservation of problematicReservations) {
      // Fix the reservation data
      const fixedReservation = {
        ...reservation,
        id: undefined, // Let database generate new ID
        status: 'completed', // Replace 'checked_out' with 'completed'
        apartment_id: boccadorId, // Set to Boccador
        created_at: reservation.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Remove any undefined or null fields
      Object.keys(fixedReservation).forEach(key => {
        if (fixedReservation[key] === undefined || fixedReservation[key] === null) {
          delete fixedReservation[key];
        }
      });
      
      const { data: newReservation, error: createError } = await supabase
        .from('reservations')
        .insert(fixedReservation)
        .select()
        .single();
      
      if (createError) {
        console.error(`✗ Failed to recreate reservation (was ${reservation.id}):`, createError.message);
      } else {
        console.log(`✓ Recreated reservation (was ${reservation.id}, now ${newReservation.id})`);
        recreatedReservations.push({
          old_id: reservation.id,
          new_id: newReservation.id
        });
      }
    }
    
    console.log(`\n✅ Successfully recreated ${recreatedReservations.length} reservations`);
    
    // Save ID mapping
    if (recreatedReservations.length > 0) {
      const mappingPath = path.join(__dirname, 'reservation-id-mapping.json');
      fs.writeFileSync(mappingPath, JSON.stringify(recreatedReservations, null, 2));
      console.log(`✓ Saved ID mapping to ${mappingPath}`);
    }
    
    console.log('\nStep 5: Final verification...');
    
    // Verify all reservations are now on Boccador
    const { data: finalCheck, error: checkError } = await supabase
      .from('reservations')
      .select('apartment_id, status')
      .eq('owner_id', userId);
    
    if (!checkError && finalCheck) {
      const boccadorCount = finalCheck.filter(r => r.apartment_id === boccadorId).length;
      const otherCount = finalCheck.filter(r => r.apartment_id !== boccadorId).length;
      const invalidCount = finalCheck.filter(r => r.status === 'checked_out').length;
      
      console.log(`\n📊 Final Status:`);
      console.log(`- Total reservations: ${finalCheck.length}`);
      console.log(`- Assigned to Boccador: ${boccadorCount}`);
      console.log(`- Assigned to other apartments: ${otherCount}`);
      console.log(`- With invalid 'checked_out' status: ${invalidCount}`);
      
      if (boccadorCount === finalCheck.length && invalidCount === 0) {
        console.log('\n🎉 SUCCESS! All reservations are now assigned to Boccador with valid status!');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

recreateInvalidReservations();