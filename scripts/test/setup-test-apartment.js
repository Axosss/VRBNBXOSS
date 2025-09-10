const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTestApartment() {
  console.log('🏠 Setting up test apartment with iCal URLs...\n');

  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log('❌ Not authenticated. Please login first at http://localhost:3000/login');
    return;
  }

  console.log(`✅ Authenticated as: ${user.email}`);

  // 2. Check for existing apartments
  const { data: apartments, error: aptError } = await supabase
    .from('apartments')
    .select('id, name')
    .eq('owner_id', user.id);

  if (aptError) {
    console.log('❌ Error fetching apartments:', aptError.message);
    return;
  }

  let targetApartment;

  if (apartments && apartments.length > 0) {
    targetApartment = apartments[0];
    console.log(`\n📋 Found existing apartment: ${targetApartment.name} (${targetApartment.id})`);
  } else {
    console.log('\n⚠️  No apartments found. Creating Boccador test apartment...');
    
    const { data: newApt, error: createError } = await supabase
      .from('apartments')
      .insert({
        name: 'Boccador',
        address: {
          street: '123 Test Street',
          city: 'Paris',
          state: 'IDF',
          zipCode: '75001',
          country: 'France'
        },
        capacity: 4,
        bedrooms: 2,
        bathrooms: 1,
        owner_id: user.id,
        created_by: user.id
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Failed to create apartment:', createError.message);
      return;
    }

    targetApartment = newApt;
    console.log(`✅ Created apartment: ${targetApartment.name}`);
  }

  // 3. Check/Add iCal URLs
  const { data: existingUrls, error: urlError } = await supabase
    .from('apartment_ical_urls')
    .select('platform, ical_url')
    .eq('apartment_id', targetApartment.id);

  if (urlError) {
    console.log('❌ Error checking URLs:', urlError.message);
  } else if (existingUrls && existingUrls.length > 0) {
    console.log('\n✅ iCal URLs already configured:');
    existingUrls.forEach(url => {
      console.log(`   - ${url.platform}: ${url.ical_url.substring(0, 50)}...`);
    });
  } else {
    console.log('\n📝 Adding test iCal URLs...');
    
    const testUrls = [
      {
        apartment_id: targetApartment.id,
        platform: 'airbnb',
        ical_url: 'https://www.airbnb.fr/calendar/ical/35252063.ics?s=5e6099b3fafb1b558aa139c53ab59ed5',
        is_active: true
      },
      {
        apartment_id: targetApartment.id,
        platform: 'vrbo',
        ical_url: 'http://www.vrbo.com/icalendar/8494e25875ac49898221299bf80c4973.ics',
        is_active: true
      }
    ];

    for (const url of testUrls) {
      const { error: insertError } = await supabase
        .from('apartment_ical_urls')
        .insert(url);
      
      if (insertError) {
        if (insertError.message.includes('duplicate')) {
          console.log(`   ℹ️  ${url.platform} URL already exists`);
        } else {
          console.log(`   ❌ Failed to add ${url.platform} URL:`, insertError.message);
        }
      } else {
        console.log(`   ✅ Added ${url.platform} URL`);
      }
    }
  }

  // 4. Test manual sync
  console.log('\n🔄 Testing sync via API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/sync/airbnb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': document?.cookie || '' // Will be empty in Node
      },
      body: JSON.stringify({ apartmentId: targetApartment.id })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sync completed:', {
        eventsFound: result.eventsFound,
        reservationsFound: result.reservationsFound,
        newReservations: result.newReservations,
        platforms: result.syncResults
      });
    } else {
      const error = await response.text();
      console.log('⚠️  Sync failed via API:', error);
      console.log('   This is normal when running from Node.js');
      console.log('   Please use the web interface to test sync');
    }
  } catch (err) {
    console.log('ℹ️  Cannot sync from Node.js (authentication required)');
  }

  // 5. Check staging table
  const { data: staged, error: stageError } = await supabase
    .from('reservation_staging')
    .select('platform, check_in, check_out, guest_name, stage_status')
    .eq('apartment_id', targetApartment.id)
    .order('check_in', { ascending: true });

  if (stageError) {
    console.log('❌ Error checking staged reservations:', stageError.message);
  } else if (staged && staged.length > 0) {
    console.log(`\n📥 Found ${staged.length} staged reservations:`);
    staged.forEach(s => {
      const status = s.stage_status === 'pending' ? '⏳' : s.stage_status === 'confirmed' ? '✅' : '❌';
      console.log(`   ${status} ${s.platform.toUpperCase()}: ${s.check_in} to ${s.check_out} ${s.guest_name ? `- ${s.guest_name}` : ''}`);
    });
  } else {
    console.log('\n📭 No staged reservations found yet');
  }

  console.log('\n✨ Setup complete! Next steps:');
  console.log(`1. Go to http://localhost:3000/dashboard/apartments/${targetApartment.id}/edit`);
  console.log('2. Check the "Platform Integrations" section to see/edit iCal URLs');
  console.log('3. Go to http://localhost:3000/dashboard/reservations');
  console.log('4. Click "Sync Now" to import reservations from both platforms');
  console.log('5. Review pending imports with platform badges (pink=Airbnb, blue=VRBO)');
}

setupTestApartment().catch(console.error);