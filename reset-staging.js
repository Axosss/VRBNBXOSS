// Reset staging data to force re-sync with corrected dates
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function resetStaging() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('Resetting staging data to force re-sync with corrected dates...\n');
  
  try {
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.signInWithPassword({
      email: 'axossoltani@icloud.com',
      password: 'Azerty12345!@'
    });
    
    if (userError) {
      console.error('Auth error:', userError);
      return;
    }
    
    console.log('Authenticated as:', user.email);
    
    // Get user's apartments
    const { data: apartments, error: apartmentError } = await supabase
      .from('apartments')
      .select('id, name')
      .eq('owner_id', user.id);
    
    if (apartmentError) {
      console.error('Error getting apartments:', apartmentError);
      return;
    }
    
    console.log(`Found ${apartments.length} apartments`);
    
    for (const apartment of apartments) {
      // Delete staging data for this apartment
      const { error: deleteError } = await supabase
        .from('reservation_staging')
        .delete()
        .eq('apartment_id', apartment.id);
      
      if (deleteError) {
        console.error(`Error clearing staging for ${apartment.name}:`, deleteError);
      } else {
        console.log(`✅ Cleared staging for ${apartment.name}`);
      }
      
      // Delete checksums to force re-sync
      const { error: checksumError } = await supabase
        .from('sync_checksums')
        .delete()
        .eq('apartment_id', apartment.id);
      
      if (checksumError) {
        console.error(`Error clearing checksums for ${apartment.name}:`, checksumError);
      } else {
        console.log(`✅ Cleared checksums for ${apartment.name}`);
      }
    }
    
    console.log('\n✨ Staging reset complete!');
    console.log('Now click "Sync Now" in the web interface to re-import with correct dates.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

resetStaging();