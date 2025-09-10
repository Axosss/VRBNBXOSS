const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  console.log('Please add it to apply the policies.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPublicPolicies() {
  console.log('🔧 Applying public viewing policies...\n');

  try {
    // Check if policies already exist
    const { data: existingPolicies, error: checkError } = await supabase.rpc('get_policies', {
      table_name: 'apartments'
    }).catch(() => ({ data: null, error: null }));

    // Create apartment viewing policy
    const apartmentPolicy = `
      CREATE POLICY "Public users can view apartment details" ON apartments
        FOR SELECT
        USING (true);
    `;

    const { error: apartmentError } = await supabase.rpc('exec_sql', {
      sql: apartmentPolicy
    }).catch(e => ({ error: e }));

    if (apartmentError && !apartmentError.message?.includes('already exists')) {
      console.log('Note: Could not create apartment policy via RPC');
    }

    // Create reservation viewing policy
    const reservationPolicy = `
      CREATE POLICY "Public users can view reservation dates" ON reservations
        FOR SELECT
        USING (true);
    `;

    const { error: reservationError } = await supabase.rpc('exec_sql', {
      sql: reservationPolicy
    }).catch(e => ({ error: e }));

    if (reservationError && !reservationError.message?.includes('already exists')) {
      console.log('Note: Could not create reservation policy via RPC');
    }

    // Test if public access works now
    console.log('\n📝 Testing public access...');
    
    // Create a client with anon key (simulates public access)
    const publicClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: apartments, error: testError } = await publicClient
      .from('apartments')
      .select('id, name')
      .limit(2);

    if (testError) {
      console.log('\n⚠️  Public access still blocked. Policies need to be applied manually.');
      console.log('\n📋 Instructions:');
      console.log('1. Go to: https://supabase.com/dashboard/project/fdfigwvbawfaefmdhxaj/sql/new');
      console.log('2. Copy and paste the content from ADD_PUBLIC_APARTMENT_POLICY.sql');
      console.log('3. Click "Run" to apply the policies');
      console.log('\n📄 File location: /Users/axoss/Documents/VRBNBXOSS/ADD_PUBLIC_APARTMENT_POLICY.sql');
    } else if (apartments && apartments.length > 0) {
      console.log('✅ Public access is working!');
      console.log('\n🏠 Public URLs for your apartments:');
      apartments.forEach(apt => {
        console.log(`\n${apt.name}:`);
        console.log(`  📱 Public: http://localhost:3000/p/${apt.id}`);
        console.log(`  🔗 Share this URL with anyone!`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n📋 Manual steps required:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Run the SQL from ADD_PUBLIC_APARTMENT_POLICY.sql');
  }
}

applyPublicPolicies().catch(console.error);