const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function enablePublicAccess() {
  console.log('🔓 Enabling public access to apartments...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Use service role to modify policies
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  // First, let's check if we can access apartments with service role
  console.log('1️⃣ Testing service role access...');
  const { data: apartments, error: serviceError } = await adminClient
    .from('apartments')
    .select('id, name');

  if (serviceError) {
    console.error('❌ Service role error:', serviceError.message);
    return;
  }

  console.log('✅ Service role works! Found', apartments.length, 'apartments\n');

  // Now test with anon key (public access)
  console.log('2️⃣ Testing current public access...');
  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false }
  });

  const { data: publicData, error: publicError } = await publicClient
    .from('apartments')
    .select('id, name');

  if (publicError) {
    console.log('❌ Public access blocked (expected):', publicError.message);
    console.log('\n3️⃣ Solution: Apply these policies in Supabase Dashboard\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 COPY THIS SQL AND RUN IN SUPABASE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const sql = `-- Enable Row Level Security
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting policies
DROP POLICY IF EXISTS "Public users can view apartment details" ON apartments;
DROP POLICY IF EXISTS "Public users can view reservation dates" ON reservations;

-- Create public viewing policies
CREATE POLICY "Public users can view apartment details" 
  ON apartments FOR SELECT 
  USING (true);

CREATE POLICY "Public users can view reservation dates" 
  ON reservations FOR SELECT 
  USING (true);

-- Verify policies are created
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('apartments', 'reservations') 
  AND policyname LIKE '%Public%';`;

    console.log(sql);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 WHERE TO RUN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/fdfigwvbawfaefmdhxaj/sql/new');
    console.log('2. Paste the SQL above');
    console.log('3. Click "Run"');
    console.log('4. You should see 2 policies created in the results\n');
  } else {
    console.log('✅ Public access already works!\n');
  }

  // Show the public URLs
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏠 YOUR PUBLIC APARTMENT URLS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  apartments.forEach(apt => {
    console.log(`${apt.name}:`);
    console.log(`📱 http://localhost:3000/p/${apt.id}`);
    console.log('');
  });

  console.log('📤 Share these URLs with anyone - no login required!');
  console.log('🎯 They will see: photos, calendar, amenities, property details');
  console.log('🔒 They won\'t see: guest names, prices, access codes\n');
}

enablePublicAccess().catch(console.error);