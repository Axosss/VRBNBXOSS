const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

async function executeSql() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        query: "ALTER TYPE reservation_platform ADD VALUE IF NOT EXISTS 'rent'"
      })
    });

    if (!response.ok) {
      // Alternative: Use the SQL editor endpoint
      const sqlResponse = await fetch(`${supabaseUrl.replace('supabase.co', 'supabase.co')}/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          query: "ALTER TYPE reservation_platform ADD VALUE IF NOT EXISTS 'rent'"
        })
      });
      
      if (!sqlResponse.ok) {
        console.log('Direct SQL execution not available via API.');
        console.log('\n⚠️  IMPORTANT: You need to run this SQL manually in your Supabase dashboard:');
        console.log('\n----------------------------------------');
        console.log("ALTER TYPE reservation_platform ADD VALUE IF NOT EXISTS 'rent';");
        console.log('----------------------------------------\n');
        console.log('Steps:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to the SQL Editor');
        console.log('3. Run the SQL command above');
        console.log('4. Click "Run" to execute');
      } else {
        const result = await sqlResponse.json();
        console.log('✅ Migration applied successfully!', result);
      }
    } else {
      const result = await response.json();
      console.log('✅ Migration applied successfully!', result);
    }
  } catch (error) {
    console.log('\n⚠️  Could not execute SQL via API.');
    console.log('\n📝 Please run this SQL manually in your Supabase dashboard:');
    console.log('\n----------------------------------------');
    console.log("ALTER TYPE reservation_platform ADD VALUE IF NOT EXISTS 'rent';");
    console.log('----------------------------------------\n');
    console.log('Dashboard URL:', supabaseUrl.replace('https://', 'https://app.supabase.com/project/').replace('.supabase.co', '/sql'));
  }
}

executeSql();