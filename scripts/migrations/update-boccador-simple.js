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

async function updateReservations() {
  const boccadorId = '63561c46-cbc2-4340-8f51-9c798fde898a';
  
  try {
    // Use RPC to update via SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `UPDATE reservations SET apartment_id = '${boccadorId}' WHERE apartment_id != '${boccadorId}' OR apartment_id IS NULL`
    });
    
    if (error && error.code === 'PGRST202') {
      // If RPC doesn't exist, update in batches
      console.log('Using batch update method...');
      
      // Get all reservations
      const { data: reservations, error: fetchError } = await supabase
        .from('reservations')
        .select('id')
        .neq('apartment_id', boccadorId);
      
      if (fetchError) {
        console.error('Fetch error:', fetchError);
        return;
      }
      
      console.log(`Found ${reservations?.length || 0} reservations to update`);
      
      // Update in batches
      for (const reservation of reservations || []) {
        const { error: updateError } = await supabase
          .from('reservations')
          .update({ apartment_id: boccadorId })
          .eq('id', reservation.id);
        
        if (updateError) {
          console.error(`Error updating reservation ${reservation.id}:`, updateError);
        } else {
          console.log(`Updated reservation ${reservation.id}`);
        }
      }
    } else if (error) {
      console.error('RPC error:', error);
      return;
    }
    
    // Verify the result
    const { data: stats, error: statsError } = await supabase
      .from('reservations')
      .select('apartment_id')
      .eq('apartment_id', boccadorId);
    
    if (!statsError) {
      console.log(`\n✅ Success: ${stats.length} reservations are now assigned to Boccador`);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateReservations();