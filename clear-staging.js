const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearStaging() {
  console.log('Clearing staging table to force fresh sync...');
  
  // Delete all staging entries
  const { error: deleteError } = await supabase
    .from('reservation_staging')
    .delete()
    .gte('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (deleteError) {
    console.error('Error clearing staging:', deleteError);
    return;
  }
  
  // Also clear the checksums to force re-sync
  const { error: checksumError } = await supabase
    .from('sync_checksums')
    .delete()
    .gte('apartment_id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (checksumError) {
    console.error('Error clearing checksums:', checksumError);
    return;
  }
  
  console.log('✅ Staging table and checksums cleared successfully');
  console.log('Now click "Sync Now" in the web interface to re-import with correct dates');
}

clearStaging();