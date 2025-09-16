const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking database tables...\n');

  // Check reservation_staging table
  const { data: staging, error: stagingError } = await supabase
    .from('reservation_staging')
    .select('*')
    .limit(1);

  if (stagingError) {
    console.log('❌ reservation_staging table: NOT FOUND');
    console.log('   Error:', stagingError.message);
  } else {
    console.log('✅ reservation_staging table: EXISTS');
  }

  // Check apartment_ical_urls table
  const { data: urls, error: urlsError } = await supabase
    .from('apartment_ical_urls')
    .select('*')
    .limit(1);

  if (urlsError) {
    console.log('❌ apartment_ical_urls table: NOT FOUND');
    console.log('   Error:', urlsError.message);
  } else {
    console.log('✅ apartment_ical_urls table: EXISTS');
  }

  // Check sync tables
  const tables = ['sync_deltas', 'sync_checksums', 'sync_log', 'sync_alerts'];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ ${table} table: NOT FOUND`);
    } else {
      console.log(`✅ ${table} table: EXISTS`);
    }
  }

  console.log('\n📝 Migration Status Summary:');
  console.log('- The ical_sync_tables migration needs to be applied');
  console.log('- The apartment_ical_urls migration needs to be applied');
  console.log('\nTo apply migrations:');
  console.log('1. Go to Supabase Dashboard > SQL Editor');
  console.log('2. Run the migrations from:');
  console.log('   - supabase/migrations/20250104_ical_sync_tables.sql');
  console.log('   - supabase/migrations/20250106_apartment_ical_urls.sql');
}

checkTables().catch(console.error);