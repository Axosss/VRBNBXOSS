# Airbnb iCal Sync Implementation Guide

> **Status**: 🚧 In Progress  
> **Branch**: `feature/airbnb-ical-sync`  
> **Started**: January 2025  
> **Target**: MVP in 2 weeks

## 📋 Implementation Checklist

### Phase 0: Setup & Safety
- [ ] Commit current work
- [ ] Create feature branch `feature/airbnb-ical-sync`
- [ ] Install `node-ical` package
- [ ] Get Airbnb iCal URL from host dashboard
- [ ] Test iCal parsing (read-only)

### Phase 1: Database Setup
- [ ] Create migration: `20250104_ical_sync_tables.sql`
- [ ] Add staging tables (reservation_staging)
- [ ] Add delta tracking tables (sync_deltas, sync_checksums)
- [ ] Add RLS policies
- [ ] Test migrations locally

### Phase 2: Core Logic
- [ ] Create `/src/lib/ical/` folder structure
- [ ] Build `parser.ts` - Parse iCal to JavaScript
- [ ] Build `delta.ts` - Calculate changes between syncs
- [ ] Build `sync.ts` - Main sync orchestration
- [ ] Build `types.ts` - TypeScript interfaces
- [ ] Write unit tests

### Phase 3: UI Components
- [ ] Create `pending-airbnb-imports.tsx` component
- [ ] Create `pending-import-card.tsx` for individual cards
- [ ] Add component to `/reservations` page top
- [ ] Style inline cards with Tailwind
- [ ] Add expand/edit functionality
- [ ] Add accept/reject actions

### Phase 4: API & Integration
- [ ] Create `/api/sync/airbnb/route.ts` endpoint
- [ ] Connect staging to real reservations table
- [ ] Implement conflict detection
- [ ] Add manual sync button
- [ ] Test with one apartment

### Phase 5: Dashboard Integration
- [ ] Add notification widget to dashboard
- [ ] Show pending count badge
- [ ] Add "Go to Reservations" link
- [ ] Test notification updates

### Phase 6: Testing & Refinement
- [ ] Test with real Airbnb iCal URL
- [ ] Test delta detection
- [ ] Test cancellation detection
- [ ] Test conflict scenarios
- [ ] Mobile responsive testing
- [ ] Error handling

### Phase 7: Production Preparation
- [ ] Add all apartments
- [ ] Set up Vercel Cron (optional)
- [ ] Documentation update
- [ ] Create PR
- [ ] Code review
- [ ] Merge to main

---

## 🔧 Setup Commands

```bash
# Step 1: Create branch
git add docs/
git commit -m "docs: add Airbnb iCal integration strategy"
git checkout -b feature/airbnb-ical-sync

# Step 2: Install dependencies
npm install node-ical

# Step 3: Test iCal parsing (safe, read-only)
node -e "
const ical = require('node-ical');
ical.fromURL('YOUR_ICAL_URL_HERE', {}, (err, data) => {
  console.log(JSON.stringify(data, null, 2));
});
"

# Step 4: Create migration file
touch supabase/migrations/20250104_ical_sync_tables.sql

# Step 5: Start local Supabase
npm run db:start
npm run db:migrate
```

---

## 📁 File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── reservations/
│   │   │   └── page.tsx              # Add <PendingAirbnbImports/>
│   │   └── page.tsx                  # Add sync notification
│   └── api/
│       └── sync/
│           └── airbnb/
│               └── route.ts           # Manual sync endpoint
│
├── components/
│   └── reservations/
│       ├── pending-airbnb-imports.tsx    # Main container
│       └── pending-import-card.tsx       # Individual card
│
└── lib/
    └── ical/
        ├── parser.ts                     # iCal parsing
        ├── sync.ts                       # Sync orchestration  
        ├── delta.ts                      # Change detection
        └── types.ts                      # TypeScript types
```

---

## 💾 Database Schema

### reservation_staging
```sql
CREATE TABLE reservation_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id),
  platform platform_type NOT NULL DEFAULT 'airbnb',
  
  -- Sync metadata
  sync_source VARCHAR(50) NOT NULL DEFAULT 'airbnb_ical',
  sync_uid TEXT UNIQUE,
  sync_url TEXT,
  raw_data JSONB NOT NULL,
  
  -- Parsed fields
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status_text VARCHAR(100),
  phone_last_four VARCHAR(4),
  
  -- Workflow
  stage_status VARCHAR(20) DEFAULT 'pending',
  stage_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Link to real reservation once confirmed
  reservation_id UUID REFERENCES reservations(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delta tracking
CREATE TABLE sync_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL,
  sync_timestamp TIMESTAMPTZ NOT NULL,
  events_added JSONB,
  events_removed JSONB,
  events_modified JSONB,
  checksum VARCHAR(64),
  has_changes BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checksum lookup
CREATE TABLE sync_checksums (
  apartment_id UUID PRIMARY KEY,
  current_checksum VARCHAR(64) NOT NULL,
  last_sync TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_staging_status ON reservation_staging(stage_status);
CREATE INDEX idx_staging_apartment ON reservation_staging(apartment_id);
CREATE INDEX idx_sync_deltas_apartment ON sync_deltas(apartment_id, sync_timestamp DESC);
```

---

## 🎨 UI Design Specs

### Pending Imports Section (Top of /reservations)
```
┌──────────────────────────────────────────────────────┐
│ 📥 Pending Airbnb Imports (3 new)                    │
│ Last sync: 2 hours ago • Next: 9:00 PM • [Sync Now]  │
└──────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🟡 PENDING IMPORT FROM AIRBNB       │
│ {apartment} • {dates} • {nights}    │
│ Phone (last 4): {phone}             │
│ Missing: Guest name, price          │
│                                     │
│ [✓ Accept & Edit] [✗ Reject] [👁]   │
└─────────────────────────────────────┘
```

### Expanded Edit Mode
```
┌─────────────────────────────────────┐
│ 🟡 EDITING IMPORT FROM AIRBNB       │
│ {apartment} • {dates} • {nights}    │
│                                     │
│ Guest Name: [___________________]   │
│ Guest Count: [2 ▼]                 │
│ Total Price: [€______]              │
│ Platform Fee: [€______]             │
│ Cleaning Fee: [€______]             │
│                                     │
│ Notes: [_________________________]  │
│                                     │
│ [💾 Save] [Cancel] [View on Airbnb] │
└─────────────────────────────────────┘
```

### Dashboard Widget
```
┌─────────────────────────────────────┐
│ 📥 Airbnb Sync                      │
├─────────────────────────────────────┤
│ • 3 pending review                  │
│ • Last sync: 2 hrs ago              │
│                                     │
│ [Go to Reservations →]              │
└─────────────────────────────────────┘
```

---

## 🧪 Test Cases

### Parser Tests
- [ ] Parse valid iCal file
- [ ] Handle empty calendar
- [ ] Parse multiple events
- [ ] Extract reservation ID from URL
- [ ] Extract phone last 4 digits
- [ ] Handle malformed data

### Delta Tests  
- [ ] Detect new reservations
- [ ] Detect cancelled reservations
- [ ] Detect modified dates
- [ ] Calculate checksum correctly
- [ ] Handle no changes

### UI Tests
- [ ] Display pending imports
- [ ] Accept and create reservation
- [ ] Reject import
- [ ] Edit before accepting
- [ ] Conflict detection warning
- [ ] Mobile responsive

### Integration Tests
- [ ] Manual sync button
- [ ] Staging to reservation flow
- [ ] Dashboard notification update
- [ ] Multiple apartment handling

---

## 📝 Code Snippets

### iCal Parser (parser.ts)
```typescript
import * as ical from 'node-ical';

export interface ParsedEvent {
  uid: string;
  checkIn: Date;
  checkOut: Date;
  summary: string;
  description?: string;
  isReservation: boolean;
  platformId?: string;
  phoneLast4?: string;
  raw: any;
}

export class AirbnbICalParser {
  async parse(icalData: string): Promise<ParsedEvent[]> {
    const events = ical.parseICS(icalData);
    const parsed: ParsedEvent[] = [];
    
    for (const key in events) {
      const event = events[key];
      if (event.type === 'VEVENT') {
        const isReservation = event.summary?.includes('Reserved');
        
        // Extract reservation ID from URL
        const urlMatch = event.description?.match(/\/([A-Z0-9]+)$/);
        const platformId = urlMatch ? urlMatch[1] : null;
        
        // Extract phone last 4
        const phoneMatch = event.description?.match(/(\d{4})$/);
        const phoneLast4 = phoneMatch ? phoneMatch[1] : null;
        
        parsed.push({
          uid: event.uid,
          checkIn: event.start,
          checkOut: event.end,
          summary: event.summary,
          description: event.description,
          isReservation,
          platformId,
          phoneLast4,
          raw: event
        });
      }
    }
    
    return parsed.filter(e => e.isReservation);
  }
}
```

### Sync API Route (/api/sync/airbnb/route.ts)
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AirbnbICalParser } from '@/lib/ical/parser';

export async function POST(request: Request) {
  const supabase = createClient();
  const parser = new AirbnbICalParser();
  
  try {
    // Get iCal URL from environment or database
    const icalUrl = process.env.AIRBNB_ICAL_URL;
    
    // Fetch iCal data
    const response = await fetch(icalUrl);
    const icalData = await response.text();
    
    // Parse events
    const events = await parser.parse(icalData);
    
    // Store in staging table
    for (const event of events) {
      await supabase.from('reservation_staging').upsert({
        sync_uid: event.uid,
        check_in: event.checkIn,
        check_out: event.checkOut,
        status_text: event.summary,
        phone_last_four: event.phoneLast4,
        raw_data: event.raw
      }, {
        onConflict: 'sync_uid'
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      eventsProcessed: events.length 
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Sync failed', 
      details: error.message 
    }, { 
      status: 500 
    });
  }
}
```

---

## 🔄 Rollback Procedures

```bash
# Quick rollback to main branch
git checkout main

# Remove feature branch
git branch -D feature/airbnb-ical-sync

# Rollback database (if migrations were applied)
supabase migration down 20250104_ical_sync_tables

# Remove node-ical package
npm uninstall node-ical

# Reset local database
npm run db:reset
```

---

## 📊 Progress Tracking

### Current Status
- **Phase**: 0 - Setup
- **Blockers**: None
- **Next Step**: Create feature branch

### Timeline
- Week 1: Phases 0-3 (Setup, Database, Core Logic)
- Week 2: Phases 4-6 (UI, API, Testing)
- Week 3: Phase 7 (Production)

---

## 📝 Notes & Decisions

### Decisions Made
1. **UI Location**: Inline cards at top of /reservations page (not separate admin)
2. **Sync Frequency**: Twice daily (9 AM, 9 PM)
3. **Dependencies**: Only `node-ical` needed
4. **Storage**: Delta-based to save 90% space

### Open Questions
- [ ] Use Vercel Cron or Supabase pg_cron?
- [ ] Auto-accept if all data present?
- [ ] How to handle guest name matching?

### Issues Encountered
_To be filled as we progress_

---

## 🚀 Getting Started

1. **Get your Airbnb iCal URL**:
   - Go to Airbnb → Host → Calendar
   - Click Import/Export → Export Calendar
   - Copy the URL

2. **Start implementation**:
   ```bash
   git checkout -b feature/airbnb-ical-sync
   npm install node-ical
   ```

3. **Follow the checklist** above in order

---

_Last Updated: [Will be updated as we progress]_