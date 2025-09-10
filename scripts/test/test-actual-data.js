const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// First test with service role
const adminSupabase = createClient(supabaseUrl, serviceKey);
// Then test with anon
const supabase = createClient(supabaseUrl, anonKey);

async function testData() {
  console.log('Testing apartment data fetch...\n');
  
  const apartmentId = '63561c46-cbc2-4340-8f51-9c798fde898a';
  
  // Test with service role first
  console.log('1. With SERVICE ROLE key:');
  const { data: adminData, error: adminError } = await adminSupabase
    .from('apartments')
    .select('id, name')
    .eq('id', apartmentId);
    
  console.log('  Error:', adminError);
  console.log('  Data count:', adminData ? adminData.length : 0);
  if (adminData && adminData.length > 0) {
    console.log('  Found:', adminData[0].name);
  }
  
  // Test with anon key
  console.log('\n2. With ANON key (public access):');
  const { data, error } = await supabase
    .from('apartments')
    .select('id, name')
    .eq('id', apartmentId);
    
  console.log('  Error:', error);
  console.log('  Data count:', data ? data.length : 0);
  if (data && data.length > 0) {
    console.log('  Found:', data[0].name);
  }
  
  // Check RLS status
  console.log('\n3. Checking RLS policies...');
  const { data: policies, error: policyError } = await adminSupabase
    .rpc('get_policies', { table_name: 'apartments' })
    .catch(() => ({ data: null, error: 'Function not available' }));
    
  if (policies) {
    console.log('  Policies found:', policies.length);
  } else {
    console.log('  Could not check policies directly');
  }
}

testData().catch(console.error);