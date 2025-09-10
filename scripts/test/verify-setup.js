const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('✅ VRBO Integration Setup Verification\n');
  console.log('=' .repeat(50));
  
  // 1. Check tables exist
  console.log('\n📊 Database Tables:');
  
  const tables = [
    'reservation_staging',
    'apartment_ical_urls', 
    'sync_deltas',
    'sync_checksums',
    'sync_log',
    'sync_alerts'
  ];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select('id')
      .limit(1);
    
    if (error && error.message.includes('not found')) {
      console.log(`   ❌ ${table}: NOT FOUND`);
    } else {
      console.log(`   ✅ ${table}: EXISTS`);
    }
  }
  
  // 2. Check for any apartments with URLs
  console.log('\n🏠 Apartments with iCal URLs:');
  
  const { data: urls, error: urlError } = await supabase
    .from('apartment_ical_urls')
    .select('apartment_id, platform, ical_url, is_active');
  
  if (urlError) {
    console.log('   ❌ Error fetching URLs:', urlError.message);
  } else if (urls && urls.length > 0) {
    console.log(`   Found ${urls.length} configured URL(s):`);
    urls.forEach(u => {
      console.log(`   - ${u.platform}: ${u.is_active ? '✅ Active' : '❌ Inactive'}`);
      console.log(`     ${u.ical_url.substring(0, 60)}...`);
    });
  } else {
    console.log('   ⚠️  No iCal URLs configured yet');
  }
  
  // 3. Check for staged reservations
  console.log('\n📥 Staged Reservations:');
  
  const { data: staged, count } = await supabase
    .from('reservation_staging')
    .select('platform, stage_status', { count: 'exact' })
    .limit(10);
  
  if (staged && staged.length > 0) {
    // Count by platform
    const byPlatform = {};
    const byStatus = {};
    
    staged.forEach(s => {
      byPlatform[s.platform] = (byPlatform[s.platform] || 0) + 1;
      byStatus[s.stage_status] = (byStatus[s.stage_status] || 0) + 1;
    });
    
    console.log(`   Total: ${count} reservations`);
    console.log('   By Platform:', byPlatform);
    console.log('   By Status:', byStatus);
  } else {
    console.log('   No staged reservations found');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('\n🎯 Next Steps:\n');
  console.log('1. Login at http://localhost:3000/login');
  console.log('2. Go to Dashboard > Apartments');
  console.log('3. Edit any apartment and scroll to "Platform Integrations"');
  console.log('4. Add your Airbnb and VRBO iCal URLs');
  console.log('5. Go to Dashboard > Reservations');
  console.log('6. Click "Sync Now" to import reservations');
  console.log('7. Review pending imports with platform badges:');
  console.log('   - Pink badge = Airbnb');
  console.log('   - Blue badge = VRBO');
  
  console.log('\n📝 Test iCal URLs (if needed):');
  console.log('Airbnb: https://www.airbnb.fr/calendar/ical/35252063.ics?s=5e6099b3fafb1b558aa139c53ab59ed5');
  console.log('VRBO: http://www.vrbo.com/icalendar/8494e25875ac49898221299bf80c4973.ics');
}

verifySetup().catch(console.error);