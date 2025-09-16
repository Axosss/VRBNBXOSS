const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please add them to your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function applyPolicies() {
  console.log('🚀 Applying public viewing policies...\n');

  // First, check existing policies
  const { data: existingPolicies } = await supabase
    .from('apartments')
    .select('id')
    .limit(1);

  // SQL to create policies
  const sql = `
    -- Drop existing policies if they exist (to avoid conflicts)
    DROP POLICY IF EXISTS "Public users can view apartment details" ON apartments;
    DROP POLICY IF EXISTS "Public users can view reservation dates" ON reservations;
    
    -- Create new policies for public viewing
    CREATE POLICY "Public users can view apartment details" ON apartments
      FOR SELECT
      USING (true);
    
    CREATE POLICY "Public users can view reservation dates" ON reservations
      FOR SELECT
      USING (true);
  `;

  try {
    // Execute SQL directly using service role
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      // Alternative: Apply policies one by one
      console.log('Applying policies individually...\n');
      
      // For apartments
      await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ 
          sql: `CREATE POLICY "public_view_apartments" ON apartments FOR SELECT USING (true);`
        })
      }).catch(() => {});

      // For reservations
      await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ 
          sql: `CREATE POLICY "public_view_reservations" ON reservations FOR SELECT USING (true);`
        })
      }).catch(() => {});
    }

    // Test with anon key
    console.log('📝 Testing public access...\n');
    const anonKey = '***REMOVED***';
    
    const publicClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false }
    });

    const { data: apartments, error } = await publicClient
      .from('apartments')
      .select('id, name')
      .limit(5);

    if (error) {
      console.log('⚠️  Public access test failed:', error.message);
      console.log('\nPolicies may need to be applied manually in Supabase Dashboard.');
      console.log('Go to: https://supabase.com/dashboard/project/fdfigwvbawfaefmdhxaj/sql/new');
      console.log('\nPaste this SQL:');
      console.log('```sql');
      console.log('ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;');
      console.log('ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('CREATE POLICY "Anyone can view apartments" ON apartments');
      console.log('  FOR SELECT USING (true);');
      console.log('');
      console.log('CREATE POLICY "Anyone can view reservations" ON reservations');
      console.log('  FOR SELECT USING (true);');
      console.log('```');
    } else {
      console.log('✅ Success! Public access is now enabled!\n');
      console.log('🏠 Your public apartment pages:');
      console.log('');
      console.log('Boccador:');
      console.log('  📱 http://localhost:3000/p/63561c46-cbc2-4340-8f51-9c798fde898a');
      console.log('');
      console.log('Montaigne:');
      console.log('  📱 http://localhost:3000/p/987be56d-3c36-42a9-89a6-2a06300a59e9');
      console.log('');
      console.log('📤 Share these URLs with anyone - no login required!');
      console.log('');
      console.log('🎯 Features available on public pages:');
      console.log('  • Photo gallery');
      console.log('  • Property details');
      console.log('  • Amenities list');
      console.log('  • Availability calendar');
      console.log('  • Floor plans');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

applyPolicies().catch(console.error);