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

async function forceUpdateAllToBoccador() {
  const boccadorId = '63561c46-cbc2-4340-8f51-9c798fde898a';
  const userId = '4997ae03-f7fe-4709-b885-2b78c435d6cc';
  
  try {
    console.log('Executing direct SQL update to bypass enum validation...\n');
    
    // First, try to use RPC to execute raw SQL
    const { data: rpcResult, error: rpcError } = await supabase.rpc('exec_sql', {
      query: `
        -- First fix invalid status values
        UPDATE reservations 
        SET status = 'completed'
        WHERE status = 'checked_out' 
        AND owner_id = '${userId}';
        
        -- Then update all reservations to Boccador
        UPDATE reservations 
        SET apartment_id = '${boccadorId}'
        WHERE owner_id = '${userId}';
      `
    });
    
    if (rpcError && rpcError.code === 'PGRST202') {
      console.log('RPC function not available, trying alternative approach...\n');
      
      // Get all reservations with their current data
      const { data: reservations, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('owner_id', userId);
      
      if (fetchError) {
        console.error('Error fetching reservations:', fetchError);
        return;
      }
      
      console.log(`Found ${reservations.length} reservations to process\n`);
      
      // Process each reservation with proper status
      let updatedCount = 0;
      let skippedCount = 0;
      
      for (const reservation of reservations) {
        // Prepare update data
        const updateData = {
          apartment_id: boccadorId
        };
        
        // Fix status if needed
        if (reservation.status === 'checked_out') {
          // Create a new reservation with fixed status
          const fixedReservation = {
            ...reservation,
            id: undefined, // Remove ID to create new
            status: 'completed',
            apartment_id: boccadorId,
            created_at: undefined,
            updated_at: new Date().toISOString()
          };
          
          // Delete the old one and create new
          const { error: deleteError } = await supabase
            .from('reservations')
            .delete()
            .eq('id', reservation.id);
          
          if (!deleteError) {
            const { error: createError } = await supabase
              .from('reservations')
              .insert(fixedReservation);
            
            if (createError) {
              console.error(`Failed to recreate ${reservation.id}:`, createError.message);
              skippedCount++;
            } else {
              console.log(`✓ Fixed and updated reservation (was ${reservation.id})`);
              updatedCount++;
            }
          } else {
            console.error(`Failed to delete ${reservation.id}:`, deleteError.message);
            skippedCount++;
          }
        } else {
          // Just update apartment for valid status
          const { error: updateError } = await supabase
            .from('reservations')
            .update(updateData)
            .eq('id', reservation.id);
          
          if (updateError) {
            console.error(`Failed to update ${reservation.id}:`, updateError.message);
            skippedCount++;
          } else {
            console.log(`✓ Updated reservation ${reservation.id}`);
            updatedCount++;
          }
        }
      }
      
      console.log(`\n✅ Process completed:`);
      console.log(`- Successfully processed: ${updatedCount} reservations`);
      console.log(`- Skipped/Failed: ${skippedCount} reservations`);
      
    } else if (rpcError) {
      console.error('RPC error:', rpcError);
    } else {
      console.log('✅ Successfully updated all reservations via SQL!');
    }
    
    // Verify the final state
    const { data: finalCheck, error: checkError } = await supabase
      .from('reservations')
      .select('apartment_id, status')
      .eq('owner_id', userId);
    
    if (!checkError && finalCheck) {
      const boccadorCount = finalCheck.filter(r => r.apartment_id === boccadorId).length;
      const otherCount = finalCheck.filter(r => r.apartment_id !== boccadorId).length;
      const invalidStatusCount = finalCheck.filter(r => r.status === 'checked_out').length;
      
      console.log(`\n📊 Final Status:`);
      console.log(`- Boccador apartment: ${boccadorCount} reservations`);
      console.log(`- Other apartments: ${otherCount} reservations`);
      console.log(`- Invalid 'checked_out' status: ${invalidStatusCount} reservations`);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

forceUpdateAllToBoccador();