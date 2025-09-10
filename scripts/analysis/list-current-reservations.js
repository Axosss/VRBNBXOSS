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

async function listReservations() {
  const userId = '4997ae03-f7fe-4709-b885-2b78c435d6cc';
  
  try {
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('id, check_in, check_out, status, contact_info, total_price')
      .eq('owner_id', userId)
      .order('check_in', { ascending: false });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`Total reservations: ${reservations.length}\n`);
    console.log('Recent reservations:');
    console.log('==================\n');
    
    reservations.slice(0, 10).forEach(r => {
      const name = r.contact_info?.name || r.contact_info?.guestName || 'Unknown';
      console.log(`${r.check_in} to ${r.check_out}`);
      console.log(`  Guest: ${name}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Price: $${r.total_price}`);
      console.log(`  ID: ${r.id}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

listReservations();