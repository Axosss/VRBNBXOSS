const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBoccadorSync() {
  console.log('🔍 Testing Boccador apartment sync setup...\n');

  // 1. Find Boccador apartment
  const { data: apartments, error: aptError } = await supabase
    .from('apartments')
    .select('id, name')
    .eq('name', 'Boccador')
    .single();

  if (aptError || !apartments) {
    console.log('❌ Boccador apartment not found');
    console.log('   You may need to create it or use a different apartment');
    return;
  }

  console.log(`✅ Found Boccador apartment: ${apartments.id}`);

  // 2. Check iCal URLs
  const { data: urls, error: urlError } = await supabase
    .from('apartment_ical_urls')
    .select('platform, ical_url, is_active')
    .eq('apartment_id', apartments.id);

  if (urlError) {
    console.log('❌ Error fetching iCal URLs:', urlError.message);
    return;
  }

  if (!urls || urls.length === 0) {
    console.log('⚠️  No iCal URLs configured for Boccador');
    console.log('   Adding test URLs...');
    
    // Add test URLs
    const testUrls = [
      {
        apartment_id: apartments.id,
        platform: 'airbnb',
        ical_url: 'https://www.airbnb.fr/calendar/ical/35252063.ics?s=5e6099b3fafb1b558aa139c53ab59ed5',
        is_active: true
      },
      {
        apartment_id: apartments.id,
        platform: 'vrbo',
        ical_url: 'http://www.vrbo.com/icalendar/8494e25875ac49898221299bf80c4973.ics',
        is_active: true
      }
    ];

    for (const url of testUrls) {
      const { error: insertError } = await supabase
        .from('apartment_ical_urls')
        .upsert(url, { onConflict: 'apartment_id,platform' });
      
      if (insertError) {
        console.log(`   ❌ Failed to add ${url.platform} URL:`, insertError.message);
      } else {
        console.log(`   ✅ Added ${url.platform} URL`);
      }
    }
  } else {
    console.log(`\n📋 Configured iCal URLs:`);
    urls.forEach(url => {
      console.log(`   ${url.platform}: ${url.is_active ? '✅' : '❌'} ${url.ical_url.substring(0, 50)}...`);
    });
  }

  // 3. Test sync endpoint
  console.log('\n🔄 Testing sync endpoint...');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/sync-airbnb`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ apartmentId: apartments.id })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sync endpoint working:', result);
    } else {
      console.log('⚠️  Sync endpoint not configured or not accessible');
      console.log('   This is normal - sync is handled by the Next.js API');
    }
  } catch (err) {
    console.log('ℹ️  Edge function not available (expected)');
  }

  // 4. Check for staged reservations
  const { data: staged, error: stagedError } = await supabase
    .from('reservation_staging')
    .select('id, platform, check_in, check_out, guest_name, stage_status')
    .eq('apartment_id', apartments.id)
    .eq('stage_status', 'pending');

  if (stagedError) {
    console.log('❌ Error checking staged reservations:', stagedError.message);
  } else if (staged && staged.length > 0) {
    console.log(`\n📥 Found ${staged.length} pending imports:`);
    staged.forEach(s => {
      console.log(`   - ${s.platform}: ${s.check_in} to ${s.check_out} ${s.guest_name ? `(${s.guest_name})` : ''}`);
    });
  } else {
    console.log('\n📭 No pending imports found');
    console.log('   Run sync from the web interface to import reservations');
  }

  console.log('\n✨ Setup complete! Next steps:');
  console.log('1. Go to http://localhost:3000/dashboard/reservations');
  console.log('2. Click "Sync Now" to import reservations');
  console.log('3. Review and confirm pending imports');
}

testBoccadorSync().catch(console.error);