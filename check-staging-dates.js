const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDates() {
  const { data, error } = await supabase
    .from('reservation_staging')
    .select('guest_name, check_in, check_out, phone_last_four, platform')
    .order('check_in');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Current staging dates in database:\n');
  data.forEach(r => {
    const name = r.guest_name || `Phone ****${r.phone_last_four}` || 'Unknown';
    console.log(`${r.platform.toUpperCase()} - ${name}:`);
    console.log(`  DB: ${r.check_in} to ${r.check_out}`);
    console.log('');
  });
}

checkDates();