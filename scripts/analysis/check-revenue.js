const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRevenue() {
  const userId = '4997ae03-f7fe-4709-b885-2b78c435d6cc';
  
  try {
    // Get all reservations
    const { data: allReservations, error } = await supabase
      .from('reservations')
      .select('id, check_in, check_out, total_price, status, guest_count')
      .eq('owner_id', userId)
      .order('check_in', { ascending: false });
    
    if (error) {
      console.error('Error fetching reservations:', error);
      return;
    }
    
    console.log(`Found ${allReservations.length} total reservations\n`);
    
    // Filter active reservations (not cancelled or draft)
    const activeReservations = allReservations.filter(
      r => r.status !== 'cancelled' && r.status !== 'draft'
    );
    
    console.log(`Active reservations: ${activeReservations.length}\n`);
    
    // Calculate total revenue from ALL active reservations
    const totalRevenue = activeReservations.reduce((sum, r) => sum + (Number(r.total_price) || 0), 0);
    
    console.log('Revenue Analysis:');
    console.log('=================');
    console.log(`Total Revenue (all time): $${totalRevenue.toLocaleString()}`);
    console.log(`Average per reservation: $${Math.round(totalRevenue / activeReservations.length).toLocaleString()}`);
    
    // Show individual reservations
    console.log('\nDetailed Reservations:');
    console.log('=====================');
    activeReservations.forEach(r => {
      console.log(`${r.check_in} to ${r.check_out}: $${r.total_price} (${r.guest_count} guests) - ${r.status}`);
    });
    
    // Check last 3 months specifically
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const today = new Date();
    
    const last3MonthsReservations = activeReservations.filter(r => {
      const checkIn = new Date(r.check_in);
      const checkOut = new Date(r.check_out);
      // Reservation overlaps with the last 3 months period
      return checkOut >= threeMonthsAgo && checkIn <= today;
    });
    
    const last3MonthsRevenue = last3MonthsReservations.reduce((sum, r) => sum + (Number(r.total_price) || 0), 0);
    
    console.log('\nLast 3 Months:');
    console.log('==============');
    console.log(`Reservations: ${last3MonthsReservations.length}`);
    console.log(`Revenue: $${last3MonthsRevenue.toLocaleString()}`);
    
    // Monthly breakdown
    console.log('\nMonthly Revenue Breakdown:');
    console.log('=========================');
    const monthlyRevenue = {};
    
    activeReservations.forEach(r => {
      const checkIn = new Date(r.check_in);
      const monthKey = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + Number(r.total_price);
    });
    
    Object.keys(monthlyRevenue).sort().forEach(month => {
      console.log(`${month}: $${monthlyRevenue[month].toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkRevenue();