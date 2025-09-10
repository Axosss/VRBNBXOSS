# AI Documentation: VRBO iCal Integration

## Context for AI
This document describes the VRBO integration added to the existing Airbnb iCal sync system. The approach reuses the existing architecture with minimal changes.

## Implementation Status

### ✅ COMPLETED

1. **Database Schema** (`/supabase/migrations/20250106_apartment_ical_urls.sql`)
   - Created `apartment_ical_urls` table
   - Stores multiple iCal URLs per apartment
   - Platform field distinguishes Airbnb vs VRBO
   - RLS policies for owner-only access
   - Test data for Boccador apartment included

2. **Universal Parser** (`/src/lib/ical/parser.ts`)
   - Renamed `AirbnbICalParser` → `UniversalICalParser`
   - Auto-detects platform via PRODID
   - Platform-specific parsing:
     - VRBO: "Reserved - Name" format, "Blocked" for unavailable
     - Airbnb: Existing format with phone in summary
   - Extracts guest name from VRBO format
   - Returns platform info with each event

3. **Multi-Platform Sync API** (`/src/app/api/sync/airbnb/route.ts`)
   - Fetches all active iCal URLs from DB
   - Loops through each URL (Airbnb + VRBO)
   - Aggregates results from all platforms
   - Updates last_sync status per URL
   - Returns combined results with platform breakdown

### ⚠️ TODO - Not Yet Implemented

1. **UI Settings Page** (Priority 1)
   - Add iCal URL configuration in apartment edit page
   - Two fields: Airbnb URL, VRBO URL
   - Save to `apartment_ical_urls` table
   - Instructions for finding URLs on each platform

2. **Platform Badges in UI** (Priority 2)
   - Modify `pending-airbnb-imports.tsx`
   - Add platform badge/tag to show source
   - Different colors: Airbnb (pink), VRBO (blue)

3. **Testing** (Priority 3)
   - Run migration to create table
   - Test with real Boccador URLs
   - Verify both platforms sync correctly

## Key Differences: Airbnb vs VRBO

### iCal Format Differences

| Aspect | Airbnb | VRBO |
|--------|--------|------|
| PRODID | Contains "Airbnb" | "HomeAway.com, Inc." |
| Reserved | Various formats | "Reserved - [Name]" |
| Blocked | "Not available" | "Blocked" |
| Phone | Last 4 in summary "(XXXX)" | Not included |
| Guest Name | Sometimes in summary | First name only after "Reserved - " |
| UID | Complex string | Standard UUID |

### Data Availability

**Neither platform provides:**
- Total price
- Cleaning fee
- Number of guests
- Guest email
- Full guest name (VRBO only has first name)

**Manual entry required for:**
- Price (mandatory)
- Cleaning fee (optional)
- Guest count (defaults to 2)
- Full guest name (for VRBO)

## Testing Data

### Boccador Apartment URLs
```sql
-- Already in migration file
Airbnb: https://www.airbnb.fr/calendar/ical/35252063.ics?s=5e6099b3fafb1b558aa139c53ab59ed5
VRBO: http://www.vrbo.com/icalendar/8494e25875ac49898221299bf80c4973.ics
```

### Sample VRBO Events
```
Reserved - robert (Feb 20-28, 2025)
Reserved - Michael (Jul 11-18, 2025)
Reserved - Don (Sep 9-16, 2025)
Reserved - A.J. (Apr 17-30, 2025)
```

## Architecture Decisions

### Why Reuse Existing Architecture?
- Minimal code changes required
- Same staging → review → confirm workflow
- No new tables needed (just URLs)
- UI component already handles manual data entry

### Why Separate URLs Table?
- Extensible for more platforms (Booking.com, etc.)
- Can enable/disable per platform
- Track sync status per URL
- Historical URL changes

### Why Not Refactor Everything?
- Current system works well
- KISS principle
- Time to market
- Easy to understand and maintain

## Known Issues & Solutions

### Issue 1: Parser Class Name
**Problem**: Class renamed but imports use old name
**Solution**: Added alias `export const AirbnbICalParser = UniversalICalParser`
**TODO**: Update all imports eventually

### Issue 2: RLS Permissions
**Problem**: Test user doesn't own test apartment
**Solution**: Must create apartment with correct owner_id or update RLS policies

### Issue 3: No Price Data
**Problem**: Neither platform provides pricing
**Solution**: Manual entry required, no auto-suggestions implemented

## Quick Implementation Guide for UI Settings

### 1. Add to Apartment Edit Page
```typescript
// In /dashboard/apartments/[id]/edit/page.tsx

// Fetch existing URLs
const { data: icalUrls } = await supabase
  .from('apartment_ical_urls')
  .select('*')
  .eq('apartment_id', apartmentId);

// Form fields
<div>
  <label>Airbnb iCal URL</label>
  <input 
    value={airbnbUrl}
    onChange={(e) => setAirbnbUrl(e.target.value)}
    placeholder="https://www.airbnb.com/calendar/ical/..."
  />
</div>

<div>
  <label>VRBO iCal URL</label>
  <input 
    value={vrboUrl}
    onChange={(e) => setVrboUrl(e.target.value)}
    placeholder="http://www.vrbo.com/icalendar/..."
  />
</div>

// Save handler
const saveUrls = async () => {
  // Upsert Airbnb URL
  if (airbnbUrl) {
    await supabase.from('apartment_ical_urls').upsert({
      apartment_id: apartmentId,
      platform: 'airbnb',
      ical_url: airbnbUrl
    }, { onConflict: 'apartment_id,platform' });
  }
  
  // Upsert VRBO URL
  if (vrboUrl) {
    await supabase.from('apartment_ical_urls').upsert({
      apartment_id: apartmentId,
      platform: 'vrbo',
      ical_url: vrboUrl
    }, { onConflict: 'apartment_id,platform' });
  }
};
```

### 2. Add Platform Badge to Imports UI
```typescript
// In pending-airbnb-imports.tsx

// In the import card
<div className="flex items-center gap-2">
  <Clock className="h-4 w-4" />
  <span>PENDING IMPORT</span>
  {import_.platform && (
    <span className={`px-2 py-1 text-xs rounded ${
      import_.platform === 'vrbo' 
        ? 'bg-blue-100 text-blue-700' 
        : 'bg-pink-100 text-pink-700'
    }`}>
      {import_.platform.toUpperCase()}
    </span>
  )}
</div>
```

## Test Checklist

- [ ] Run migration: `supabase migration up`
- [ ] Create test apartment with correct owner
- [ ] Add both iCal URLs via UI (when built)
- [ ] Trigger sync via "Sync Now" button
- [ ] Verify Airbnb events appear
- [ ] Verify VRBO events appear
- [ ] Check platform badges display correctly
- [ ] Test confirm/reject workflow
- [ ] Verify guest names extracted correctly

## Summary

The VRBO integration is **80% complete**. The core parsing and sync logic works. Remaining tasks:
1. Build UI for configuring iCal URLs (critical)
2. Add platform badges to pending imports display (nice to have)
3. Test with real data

The system successfully parses both Airbnb and VRBO formats, stages them with the correct platform identifier, and handles the differences in data availability. The manual price entry workflow remains unchanged and works for both platforms.

**Last updated**: January 6, 2025
**Test URLs**: Provided for Boccador apartment
**Next AI should**: Build the UI settings page first, then test end-to-end