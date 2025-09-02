#!/usr/bin/env node

/**
 * Test script to demonstrate current revenue trend issues
 * This script will fetch statistics for different date ranges and show
 * how the monthly data doesn't change based on selection
 */

const { format, subMonths, subDays } = require('date-fns');

// Configuration
const BASE_URL = 'http://localhost:3000';

// Test data for different time periods
const testScenarios = [
  {
    name: 'Last Month',
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    expectedMonths: 1
  },
  {
    name: 'Last 3 Months',
    startDate: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    expectedMonths: 3
  },
  {
    name: 'Last 6 Months',
    startDate: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    expectedMonths: 6
  },
  {
    name: 'Last Year',
    startDate: format(subMonths(new Date(), 12), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    expectedMonths: 12
  },
  {
    name: 'Last 7 Days',
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    expectedMonths: 0.25 // Representing less than a month
  }
];

async function fetchStatistics(startDate, endDate) {
  try {
    // First, get the auth token from a logged-in session
    // For testing, we'll simulate this or use a test token
    const url = `${BASE_URL}/api/statistics/simple?startDate=${startDate}&endDate=${endDate}`;
    
    console.log(`Fetching: ${url}`);
    
    // Note: This will fail without authentication
    // In a real test, you'd need to authenticate first
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers here if needed
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return null;
  }
}

function analyzeResults(scenario, data) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SCENARIO: ${scenario.name}`);
  console.log(`Date Range: ${scenario.startDate} to ${scenario.endDate}`);
  console.log(`Expected data points: ~${scenario.expectedMonths} month(s)`);
  console.log('-'.repeat(60));
  
  if (!data) {
    console.log('❌ No data received (likely authentication required)');
    return;
  }
  
  // Check total metrics
  console.log('\n📊 Total Metrics:');
  console.log(`  Total Revenue: $${data.totalRevenue || 0}`);
  console.log(`  Total Reservations: ${data.totalReservations || 0}`);
  console.log(`  Occupancy Rate: ${data.occupancyRate || 0}%`);
  
  // Analyze monthly data
  console.log('\n📈 Monthly Chart Data:');
  if (data.monthlyData && Array.isArray(data.monthlyData)) {
    console.log(`  Data points returned: ${data.monthlyData.length}`);
    
    // Show which months have data
    const monthsWithRevenue = data.monthlyData.filter(m => m.revenue > 0);
    console.log(`  Months with revenue: ${monthsWithRevenue.length}`);
    
    // Display the months
    if (monthsWithRevenue.length > 0) {
      console.log('  Months included:');
      monthsWithRevenue.forEach(m => {
        console.log(`    - ${m.month}: $${m.revenue.toFixed(2)}`);
      });
    }
    
    // Check if all 12 months are always returned
    if (data.monthlyData.length === 12) {
      console.log('\n  ⚠️  ISSUE DETECTED: Always returns 12 months regardless of date range!');
      console.log(`     Expected ~${scenario.expectedMonths} months of data`);
      console.log(`     Actual: ${data.monthlyData.length} months (full year)`);
    }
  } else {
    console.log('  No monthly data available');
  }
  
  // Platform breakdown
  if (data.platformBreakdown) {
    console.log('\n💰 Platform Breakdown:');
    console.log(`  Airbnb: $${data.platformBreakdown.airbnb || 0}`);
    console.log(`  VRBO: $${data.platformBreakdown.vrbo || 0}`);
    console.log(`  Direct: $${data.platformBreakdown.direct || 0}`);
  }
}

async function runTests() {
  console.log('🧪 REVENUE TREND TEST SUITE');
  console.log('Testing how monthly data responds to different date ranges...\n');
  
  for (const scenario of testScenarios) {
    const data = await fetchStatistics(scenario.startDate, scenario.endDate);
    analyzeResults(scenario, data);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📋 SUMMARY OF FINDINGS:');
  console.log('-'.repeat(60));
  console.log(`
Current Implementation Issues:
1. Monthly data always returns 12 months (Jan-Dec of current year)
2. Chart doesn't respect the selected date range
3. No dynamic granularity (daily/weekly/monthly) based on period
4. Inconsistency between total metrics and chart data

Proposed Solutions:
1. Modify monthlyData generation to respect date range
2. Add granularity parameter (daily for <1 month, weekly for 1-3 months, monthly for >3 months)
3. Update SQL function to handle dynamic periods
4. Ensure chart X-axis labels match the selected period
5. Add period-over-period comparison capabilities
`);
}

// Check if we can connect to the API first
async function checkConnection() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log('✅ API is accessible\n');
      return true;
    } else {
      console.log(`⚠️  API returned status: ${response.status}`);
      console.log('Note: You may need to be authenticated to run these tests.\n');
      return true; // Continue anyway to show the test structure
    }
  } catch (error) {
    console.log('❌ Cannot connect to API at', BASE_URL);
    console.log('Make sure the development server is running (npm run dev)\n');
    return false;
  }
}

// Main execution
async function main() {
  const isConnected = await checkConnection();
  
  if (isConnected) {
    await runTests();
  }
  
  console.log('\n💡 To see actual data, ensure you are logged in and have some reservations in the database.');
  console.log('   You can also modify this script to include authentication tokens.\n');
}

main().catch(console.error);