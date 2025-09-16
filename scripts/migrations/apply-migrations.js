const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase service role key. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local');
  console.log('\n📝 Instructions:');
  console.log('1. Go to Supabase Dashboard > Settings > API');
  console.log('2. Copy the service_role key (secret)');
  console.log('3. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your-key-here');
  console.log('\nAlternatively, you can apply migrations manually:');
  console.log('1. Go to Supabase Dashboard > SQL Editor');
  console.log('2. Copy and run the SQL from:');
  console.log('   - supabase/migrations/20250104_ical_sync_tables.sql');
  console.log('   - supabase/migrations/20250106_apartment_ical_urls.sql');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration(filePath, name) {
  console.log(`\n📦 Applying migration: ${name}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();
    
    if (error) {
      // If RPC doesn't exist, try direct approach (won't work without proper permissions)
      console.log('⚠️  Cannot apply migration programmatically without admin access');
      console.log('   Please apply manually in Supabase Dashboard > SQL Editor');
      return false;
    }
    
    console.log(`✅ Migration ${name} applied successfully`);
    return true;
  } catch (err) {
    console.error(`❌ Error applying ${name}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Applying database migrations...');
  
  const migrations = [
    {
      file: 'supabase/migrations/20250104_ical_sync_tables.sql',
      name: 'ical_sync_tables'
    },
    {
      file: 'supabase/migrations/20250106_apartment_ical_urls.sql',
      name: 'apartment_ical_urls'
    }
  ];
  
  let allSuccess = true;
  
  for (const migration of migrations) {
    const filePath = path.join(__dirname, migration.file);
    if (fs.existsSync(filePath)) {
      const success = await applyMigration(filePath, migration.name);
      if (!success) allSuccess = false;
    } else {
      console.log(`⚠️  Migration file not found: ${migration.file}`);
      allSuccess = false;
    }
  }
  
  if (!allSuccess) {
    console.log('\n📝 Manual Migration Instructions:');
    console.log('Since automatic migration is not possible, please:');
    console.log('1. Go to: https://supabase.com/dashboard/project/fdfigwvbawfaefmdhxaj/sql/new');
    console.log('2. Copy the contents of each migration file');
    console.log('3. Paste and run them in order:');
    migrations.forEach(m => {
      console.log(`   - ${m.file}`);
    });
  }
}

main().catch(console.error);