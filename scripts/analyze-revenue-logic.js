#!/usr/bin/env node

/**
 * Analysis of the current revenue trend logic
 * This script demonstrates the issues in the code without needing authentication
 */

const { format, subMonths, startOfMonth, endOfMonth } = require('date-fns');

console.log('📊 REVENUE TREND LOGIC ANALYSIS');
console.log('='.repeat(60));

// Simulate what the current code does
function simulateCurrentLogic(dateRange) {
  console.log(`\n🔍 Testing: ${dateRange.name}`);
  console.log(`   Selected Period: ${dateRange.start} to ${dateRange.end}`);
  
  // This is what the API currently does (from route.ts lines 179-259)
  const currentYear = new Date().getFullYear();
  const monthlyData = [];
  
  console.log(`   ⚠️  Issue: Code always uses currentYear (${currentYear}) for monthly data`);
  console.log(`   Code reference: /api/statistics/simple/route.ts:179-259`);
  
  // The current implementation always generates Jan-Dec of current year
  for (let month = 0; month < 12; month++) {
    const monthStart = format(new Date(currentYear, month, 1), 'yyyy-MM-dd');
    const monthLabel = format(new Date(currentYear, month, 1), 'MMM');
    monthlyData.push({
      month: monthLabel,
      monthStart: monthStart
    });
  }
  
  console.log(`   Generated months: ${monthlyData.map(m => m.month).join(', ')}`);
  console.log(`   ❌ Problem: Always returns 12 months regardless of selection!`);
  
  return monthlyData;
}

// Show what the improved logic would do
function simulateImprovedLogic(dateRange) {
  console.log(`\n✅ Proposed improvement for: ${dateRange.name}`);
  
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  let dataPoints = [];
  let granularity = '';
  
  if (daysDiff <= 31) {
    // Daily granularity for 1 month or less
    granularity = 'daily';
    console.log(`   Granularity: Daily (${daysDiff} data points)`);
    
    // Generate daily points
    for (let d = 0; d < Math.min(daysDiff, 10); d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + d);
      dataPoints.push(format(date, 'MMM dd'));
    }
    if (daysDiff > 10) dataPoints.push('...');
    
  } else if (daysDiff <= 90) {
    // Weekly granularity for 1-3 months
    granularity = 'weekly';
    const weeks = Math.ceil(daysDiff / 7);
    console.log(`   Granularity: Weekly (~${weeks} data points)`);
    
    // Generate weekly points
    for (let w = 0; w < Math.min(weeks, 5); w++) {
      const date = new Date(start);
      date.setDate(date.getDate() + (w * 7));
      dataPoints.push(`Week of ${format(date, 'MMM dd')}`);
    }
    if (weeks > 5) dataPoints.push('...');
    
  } else {
    // Monthly granularity for 3+ months
    granularity = 'monthly';
    const monthsDiff = Math.ceil(daysDiff / 30);
    console.log(`   Granularity: Monthly (~${monthsDiff} data points)`);
    
    // Generate monthly points
    let currentDate = new Date(start);
    while (currentDate <= end) {
      dataPoints.push(format(currentDate, 'MMM yyyy'));
      currentDate.setMonth(currentDate.getMonth() + 1);
      if (dataPoints.length > 5) {
        dataPoints = dataPoints.slice(0, 5);
        dataPoints.push('...');
        break;
      }
    }
  }
  
  console.log(`   Data points: ${dataPoints.join(', ')}`);
  console.log(`   ✅ Benefit: Chart matches selected period!`);
  
  return { granularity, dataPoints };
}

// Test scenarios
const scenarios = [
  {
    name: 'Last Month',
    start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  },
  {
    name: 'Last 3 Months',
    start: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  },
  {
    name: 'Last 6 Months', 
    start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  },
  {
    name: 'Last Year',
    start: format(subMonths(new Date(), 12), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  }
];

console.log('\n' + '='.repeat(60));
console.log('CURRENT IMPLEMENTATION ISSUES:');
console.log('='.repeat(60));

scenarios.forEach(scenario => {
  simulateCurrentLogic(scenario);
});

console.log('\n' + '='.repeat(60));
console.log('PROPOSED IMPROVEMENTS:');
console.log('='.repeat(60));

scenarios.forEach(scenario => {
  simulateImprovedLogic(scenario);
});

console.log('\n' + '='.repeat(60));
console.log('📋 IMPLEMENTATION PLAN:');
console.log('='.repeat(60));
console.log(`
1. Update API endpoint (/api/statistics/simple/route.ts):
   - Modify lines 179-259 to respect date range
   - Add granularity logic based on period length
   - Return appropriate data points

2. Update Frontend (statistics/page.tsx):
   - Modify chart to handle different granularities
   - Update X-axis labels dynamically
   - Show period-appropriate tooltips

3. Update SQL function (optional):
   - Create new function for dynamic period aggregation
   - Or modify existing function to handle different granularities

4. Benefits:
   - Accurate representation of selected period
   - Better UX with appropriate detail level
   - Consistent data between metrics and chart
   - More meaningful insights for users
`);

console.log('\n✨ This will make the revenue trends actually reflect the selected timeline!');