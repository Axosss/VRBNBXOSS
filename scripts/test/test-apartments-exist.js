const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkApartments() {
  console.log('Checking apartments in database...\n');
  
  // Try with service role if available
  const { data, error } = await supabase
    .from('apartments')
    .select('id, name, owner_id')
    .limit(5);
    
  if (error) {
    console.log('Error:', error.message);
    console.log('\nThis means apartments table has RLS that blocks public access.');
    console.log('We need to add a public viewing policy to the apartments table.');
    return;
  }
  
  if (data && data.length > 0) {
    console.log(`Found ${data.length} apartments:`);
    data.forEach(apt => {
      console.log(`  - ${apt.name}: ${apt.id}`);
      console.log(`    Owner: ${apt.owner_id}`);
    });
  } else {
    console.log('No apartments found in database');
  }
}

checkApartments().catch(console.error);