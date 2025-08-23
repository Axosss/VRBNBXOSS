# VRBNBXOSS - Implementation Specification
## Rental Management Dashboard with Supabase

---
## Executive Summary

### Project Overview
A unified dashboard that helps rental property owners manage multiple apartments across Airbnb, VRBO, and direct bookings, tracking everything from reservations to cleaning schedules in one place

### Technical Foundation
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Supabase (Authentication, PostgreSQL, Edge Functions, Storage)
- **Hosting**: Vercel for frontend and API routes
- **Real-time**: Supabase Realtime for live updates
- **Database**: PostgreSQL with Row Level Security

### Problem Statement
Short-term rental property owners currently juggle multiple platforms (Airbnb, VRBO), manual booking systems, and disconnected tools to manage their properties. This creates inefficiencies in tracking reservations, coordinating cleaning services, monitoring financial performance, and maintaining guest communications.

### Target Audience

**Primary Persona: Multi-Platform Property Owner**
- Demographics: 35-55 years old, owns 1-4 rental properties
- Behavior: Actively manages listings on 2+ platforms (Airbnb, VRBO, direct bookings)
- Pain Points: Time-consuming manual coordination, missed cleaning schedules, fragmented financial tracking
- Goals: Streamline operations, maximize occupancy rates, improve guest experience

**Secondary Persona: Property Management Professional**
- Demographics: 25-45 years old, manages properties for multiple owners
- Behavior: Handles 5-20+ properties across various platforms
- Pain Points: Scaling manual processes, client reporting, operational oversight
- Goals: Operational efficiency, client satisfaction, scalable systems

---

## Feature Specifications

### MVP Features

**MVP Core Principle:** All MVP features must be fully functional and independent, providing complete value without any V2.0 dependencies. Users should be able to effectively manage their rental properties using only MVP features.

#### Feature: Authentication & User Management (Supabase Auth)
**User Story:** As a property owner, I want to securely access my rental management dashboard with my credentials, so that my property and guest data remains protected.

**Acceptance Criteria:**
- Given registration, when I create an account, then Supabase Auth creates user with email/password or Google/Facebook OAuth
- Given login, when I enter valid credentials, then Supabase handles authentication and session management
- Given password reset, when I request it, then Supabase sends secure email link to reset password
- Given profile management, when I update my information, then changes persist in profiles table
- Given multi-device access, when I login from different devices, then Supabase syncs my session
- Edge case: Handle multiple failed login attempts with Row Level Security policies

**Priority:** P0 (Security requirement for all features)
**Dependencies:** Supabase project setup, RLS policies configuration
**Technical Constraints:** Supabase Auth rate limits, custom JWT claims for roles
**UX Considerations:** Social login options, smooth onboarding flow, persistent sessions

#### Feature: Apartment Management
**User Story:** As a property owner, I want to create and manage detailed profiles for each apartment including photos, amenities, and access information.

**Acceptance Criteria:**
- Given apartment creation, when I enter basic details (name, address, capacity, bedrooms, bathrooms), then data saves to PostgreSQL with validation
- Given photo uploads, when I add images, then they store in Supabase Storage with automatic resizing via Edge Functions
- Given amenities configuration, when I select features, then they save as array in PostgreSQL
- Given access codes (WiFi, door codes), when I update them, then they're encrypted and stored securely
- Given apartment deletion, when confirmed, then soft delete maintains data integrity
- Edge case: Handle orphaned reservations when apartment is deleted

**Priority:** P0 (Foundation for all other features)
**Dependencies:** Supabase Storage setup, Edge Functions for image processing
**Technical Constraints:** Storage quotas (5GB free tier), image optimization requirements
**UX Considerations:** Drag-and-drop upload, image gallery management, progressive form

#### Feature: Calendar Management
**User Story:** As a property owner, I want to view all my reservations across multiple apartments in a unified calendar.

**Acceptance Criteria:**
- Given multiple apartments with reservations, when viewing calendar, then PostgreSQL query returns all reservations with real-time updates
- Given calendar filters, when selecting apartments, then client-side filtering applies instantly
- Given date navigation, when changing months, then efficient pagination queries execute
- Given real-time sync, when reservation changes occur, then calendar updates via Supabase Realtime subscriptions
- Edge case: Handle offline mode with service worker caching

**Priority:** P0 (Core functionality)
**Dependencies:** PostgreSQL indexes for efficient queries
**Technical Constraints:** Query performance with large datasets, real-time listener limits
**UX Considerations:** Smooth transitions, loading states, conflict visualization

#### Feature: Reservation Management
**User Story:** As a property owner, I want to create, edit, and delete reservations with platform-specific information.

**Acceptance Criteria:**
- Given reservation creation, when entering details, then PostgreSQL transaction ensures no double-booking
- Given platform selection (Airbnb/VRBO/Direct), when chosen, then conditional fields display
- Given guest information, when entered, then separate guest document creates with reference
- Given reservation modification, when saving, then database trigger validates availability
- Edge case: Handle concurrent booking attempts with PostgreSQL transactions

**Priority:** P0 (Core functionality)
**Dependencies:** Row Level Security policies, database triggers for validation
**Technical Constraints:** Transaction limits, consistency requirements
**UX Considerations:** Platform-specific forms, guest autocomplete from history

#### Feature: Cleaning Schedule Management
**User Story:** As a property owner, I want to schedule and track cleaning appointments between reservations.

**Acceptance Criteria:**
- Given checkout date, when scheduling cleaning, then available time windows calculate automatically
- Given cleaner assignment, when selected, then cleaner references in PostgreSQL foreign key
- Given cleaning status, when updated, then real-time sync notifies relevant parties
- Given recurring cleanings, when configured, then Edge Functions create future appointments
- Edge case: Handle same-day turnovers with time conflict detection

**Priority:** P0 (Critical for operations)
**Dependencies:** Reservation data, cleaner user roles
**Technical Constraints:** Complex date/time calculations, timezone handling
**UX Considerations:** Visual timeline, drag-to-reschedule, status indicators

#### Feature: Basic Statistics Dashboard
**User Story:** As a property owner, I want to view key performance metrics for my properties.

**Acceptance Criteria:**
- Given date range, when selected, then PostgreSQL aggregation queries calculate metrics
- Given property filter, when applied, then statistics recalculate client-side
- Given revenue data, when displayed, then calculations include all fee types
- Given occupancy rates, when shown, then percentage calculations are accurate
- Edge case: Handle partial months and custom date ranges

**Priority:** P1 (Important for decision making)
**Dependencies:** Reservation data with pricing information
**Technical Constraints:** Aggregation query limits, client-side calculation performance
**UX Considerations:** Interactive charts, export functionality, responsive design

### V2.0 Features (Future Development)

#### Feature: Platform Integration (iCal Sync)
**User Story:** As a property owner, I want to automatically sync reservations from Airbnb and VRBO.

**Acceptance Criteria:**
- Given iCal URLs, when configured, then Vercel Cron Jobs periodically fetch and parse data
- Given imported reservations, when synced, then deduplication logic prevents duplicates
- Given sync conflicts, when detected, then conflict resolution UI presents options
- Given platform changes, when occurring, then webhook or polling updates local data
- Edge case: Handle malformed iCal data and network failures

**Priority:** P1 (High automation value)
**Dependencies:** Vercel Cron Jobs, external API access
**Technical Constraints:** iCal parsing complexity, rate limiting, data normalization
**UX Considerations:** Sync status dashboard, conflict resolution workflow

#### Feature: Contract Generation & Legal Documentation
**User Story:** As a property owner, I want to generate mobility lease contracts and check-in/out reports automatically.

**Acceptance Criteria:**
- Given guest and apartment data, when generating contract, then Edge Function creates PDF
- Given contract templates, when customized, then Supabase Storage stores templates
- Given multi-language support, when selected, then appropriate template loads
- Given generated contracts, when created, then unique URLs provide secure access
- Edge case: Handle missing required fields with validation

**Priority:** P1 (Legal compliance requirement)
**Dependencies:** PDF generation library, template storage system
**Technical Constraints:** PDF generation performance, storage costs
**UX Considerations:** Template preview, digital signature integration

#### Feature: Guest Portal
**User Story:** As a guest, I want to access property information during my stay.

**Acceptance Criteria:**
- Given booking confirmation, when accessing portal, then Supabase Auth creates temporary access
- Given portal access, when viewing, then only relevant property information displays
- Given WiFi/access codes, when requested, then secure delivery via portal
- Given checkout instructions, when needed, then time-sensitive information appears
- Edge case: Handle expired access tokens and privacy requirements

**Priority:** P2 (Guest experience enhancement)
**Dependencies:** Separate authentication flow, security rules
**Technical Constraints:** Temporary user management, data isolation
**UX Considerations:** Mobile-first design, offline capability, multi-language

#### Feature: Automated Guest Communications
**User Story:** As a property owner, I want to automatically send check-in and check-out information to guests.

**Acceptance Criteria:**
- Given reservation confirmation, when created, then Edge Function schedules communications
- Given communication triggers, when activated, then emails/SMS send via Resend and Twilio
- Given message templates, when configured, then personalization tokens replace
- Given delivery status, when tracked, then dashboard shows communication history
- Edge case: Handle failed deliveries with retry logic

**Priority:** P2 (Guest experience automation)
**Dependencies:** Resend API, Twilio API, Vercel Cron Jobs
**Technical Constraints:** Email/SMS costs, delivery reliability
**UX Considerations:** Template editor, delivery tracking, preview functionality

#### Feature: WhatsApp Bot for Guest Support
**User Story:** As a guest, I want to get instant answers to common questions via WhatsApp.

**Acceptance Criteria:**
- Given WhatsApp message, when received, then Edge Function processes with AI service
- Given common questions, when asked, then automated responses provide information
- Given complex queries, when detected, then escalation to owner occurs
- Given conversation context, when maintained, then PostgreSQL stores chat history
- Edge case: Handle multiple languages and unknown queries

**Priority:** P3 (Advanced automation)
**Dependencies:** WhatsApp Business API, Dialogflow integration
**Technical Constraints:** API costs, message rate limits
**UX Considerations:** Natural conversation flow, clear bot limitations

---

## Functional Requirements

### User Flows

#### Primary Flow: Adding a New Reservation
1. User navigates to Reservations page
2. User clicks "Add Reservation" button
3. System displays reservation form with apartment dropdown
4. User selects apartment from PostgreSQL-populated list
5. User enters guest information (creates/updates guest record)
6. User selects booking platform (Airbnb/VRBO/Direct)
7. System displays platform-specific fields dynamically
8. User enters check-in and check-out dates
9. System validates availability via PostgreSQL query
10. User enters pricing and guest count
11. User submits form
12. API route validates and creates reservation
13. PostgreSQL transaction ensures atomicity
14. Real-time subscriptions update calendar
15. Success notification displays

#### Secondary Flow: Scheduling Cleaning
1. User views calendar with reservations
2. User identifies gap between checkout/checkin
3. User clicks "Schedule Cleaning" in gap
4. System pre-fills apartment and time window
5. User selects cleaner from PostgreSQL table
6. User sets specific date/time
7. System validates no conflicts
8. User submits cleaning appointment
9. PostgreSQL creates cleaning record
10. Edge Function notifies cleaner (V2.0)
11. Calendar updates with cleaning block

### State Management

#### Reservation States & Transitions
- **draft**: Incomplete reservation being created
  - → **pending**: Awaiting confirmation
  - → **confirmed**: All details complete
- **pending**: Awaiting platform confirmation
  - → **confirmed**: Platform confirms
  - → **cancelled**: Booking cancelled
- **confirmed**: Active reservation
  - → **checked_in**: Guest arrives
  - → **cancelled**: Cancellation before arrival
- **checked_in**: Guest currently staying
  - → **checked_out**: Guest departs
- **checked_out**: Stay complete
  - → **archived**: After 30 days
- **cancelled**: Reservation cancelled
  - → **archived**: After 30 days

**Implementation in PostgreSQL:**
- Status field with database constraints validation
- Database triggers handle automatic transitions
- Audit trail in separate audit table for state changes

#### Cleaning States & Transitions
- **needed**: Cleaning required (auto-created on checkout)
  - → **scheduled**: Cleaner assigned
- **scheduled**: Cleaning appointment set
  - → **in_progress**: Cleaning started
  - → **cancelled**: Appointment cancelled
- **in_progress**: Currently being cleaned
  - → **completed**: Cleaning finished
- **completed**: Cleaning done
  - → **verified**: Quality checked (optional)

### Data Validation Rules

#### Row Level Security Policies
```sql
-- Reservation policy
CREATE POLICY "Users can only access their own reservations" ON reservations
  FOR ALL USING (owner_id = auth.uid());

-- Apartment policy  
CREATE POLICY "Users can only access their own apartments" ON apartments
  FOR ALL USING (owner_id = auth.uid());

-- Insert validation with triggers
CREATE OR REPLACE FUNCTION validate_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check dates
  IF NEW.check_out <= NEW.check_in THEN
    RAISE EXCEPTION 'Check-out must be after check-in';
  END IF;
  
  -- Check capacity
  IF NEW.guest_count > (SELECT capacity FROM apartments WHERE id = NEW.apartment_id) THEN
    RAISE EXCEPTION 'Guest count exceeds apartment capacity';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Integration Points

#### Supabase Services Integration
- **Authentication**: Email/password, Google, Facebook OAuth
- **PostgreSQL**: Primary database for all structured data
- **Storage**: Images, documents, generated PDFs
- **Edge Functions**: Business logic, automation, integrations
- **Realtime**: Live updates and subscriptions
- **Row Level Security**: Database-level authorization

#### External Integrations (V2.0)
- **iCal Feeds**: Airbnb, VRBO calendar sync
- **WhatsApp Business API**: Guest communications
- **Payment Processing**: Stripe for direct bookings
- **Email Service**: tbd

---

## Technical Architecture

### Supabase Project Structure

```
supabase/
├── migrations/              # Database migrations
│   ├── 00001_initial_schema.sql
│   ├── 00002_create_apartments.sql
│   ├── 00003_create_reservations.sql
│   └── ...
├── functions/              # Edge Functions
│   ├── generate-contract/
│   ├── sync-calendar/
│   ├── send-notification/
│   └── calculate-stats/
├── seed/                   # Seed data
│   └── seed.sql
└── config.toml            # Supabase configuration
```

### PostgreSQL Database Schema

```sql
-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'owner',
  timezone TEXT DEFAULT 'UTC',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apartments table
CREATE TABLE apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address JSONB NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  bedrooms INTEGER,
  bathrooms DECIMAL,
  amenities TEXT[],
  photos TEXT[],
  access_codes JSONB, -- Encrypted
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guests table
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  id_document TEXT, -- Encrypted
  address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations table
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id),
  platform TEXT NOT NULL CHECK (platform IN ('airbnb', 'vrbo', 'direct')),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_count INTEGER NOT NULL CHECK (guest_count > 0),
  total_price DECIMAL NOT NULL CHECK (total_price >= 0),
  status TEXT DEFAULT 'confirmed',
  platform_reservation_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

-- Cleaners table
CREATE TABLE cleaners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  rate DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cleanings table
CREATE TABLE cleanings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  cleaner_id UUID REFERENCES cleaners(id),
  reservation_id UUID REFERENCES reservations(id),
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration INTERVAL,
  status TEXT DEFAULT 'scheduled',
  instructions TEXT,
  supplies JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  template_id UUID,
  document_url TEXT,
  signed_at TIMESTAMPTZ,
  language TEXT DEFAULT 'en',
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Frontend Architecture (Next.js)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── calendar/
│   │   ├── reservations/
│   │   ├── apartments/
│   │   ├── cleaning/
│   │   ├── statistics/
│   │   └── settings/
│   └── (public)/
│       └── guest-portal/[token]/
├── components/
│   ├── ui/              # Shadcn components
│   ├── calendar/
│   ├── forms/
│   ├── charts/
│   └── layout/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── middleware.ts
│   │   └── types.ts
│   ├── hooks/           # Custom React hooks
│   ├── utils/
│   └── validations/
└── styles/
```

### API Architecture

```typescript
// Next.js API Routes and Supabase Edge Functions

// Database triggers (PostgreSQL)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

// API Routes (Next.js)
// /api/reservations/route.ts
export async function POST(request: Request) {
  // Validate authentication
  // Create reservation with transaction
  // Trigger real-time updates
  // Return response
}

// Edge Functions (Supabase)
// generate-contract/index.ts
Deno.serve(async (req) => {
  // Validate authentication
  // Generate PDF from template
  // Store in Supabase Storage
  // Return secure URL
});

// Cron Jobs (Vercel)
// /api/cron/daily-sync/route.ts
export async function GET() {
  // Sync iCal feeds
  // Update reservation states
  // Send scheduled communications
}
```

### Security Architecture

#### Row Level Security Policies
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleanings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Apartments: Owners can access their apartments
CREATE POLICY "Owners can access their apartments" ON apartments
  FOR ALL USING (auth.uid() = owner_id);

-- Reservations: Owners can access their reservations
CREATE POLICY "Owners can access their reservations" ON reservations
  FOR ALL USING (auth.uid() = owner_id);

-- Guests: Owners can access their guests
CREATE POLICY "Owners can access their guests" ON guests
  FOR ALL USING (auth.uid() = owner_id);

-- Cleanings: Owners and assigned cleaners can access
CREATE POLICY "Cleanings access policy" ON cleanings
  FOR SELECT USING (
    auth.uid() = (SELECT owner_id FROM apartments WHERE id = apartment_id) OR
    auth.uid() = (SELECT owner_id FROM cleaners WHERE id = cleaner_id)
  );

-- Storage Security
CREATE POLICY "Apartment photos access" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'apartment-photos' AND
    auth.uid() = (SELECT owner_id FROM apartments WHERE id::text = (storage.foldername(name))[1])
  );
```

---

## Non-Functional Requirements

### Performance Targets
- **Initial Load**: < 3 seconds on 3G connection
- **Time to Interactive**: < 5 seconds
- **API Response Time**: < 500ms for 95% of requests
- **Real-time Updates**: < 100ms for Firestore listeners
- **Image Upload**: < 10 seconds for 5MB file
- **PDF Generation**: < 5 seconds for contract

### Scalability Requirements
- **Concurrent Users**: 200 active sessions per project
- **Data Volume**: 100,000 reservations per account
- **Storage**: 100GB per account (Supabase Storage)
- **Database**: Unlimited reads/writes (PostgreSQL)
- **Edge Functions**: 500,000 invocations/month
- **Growth**: Support 200% yearly growth

### Security Requirements
- **Authentication**: Supabase Auth with MFA support
- **Authorization**: Row Level Security policies
- **Data Encryption**: PostgreSQL encryption at rest, TLS in transit
- **PII Protection**: Encrypted fields for sensitive data
- **Audit Logging**: Database triggers log all data modifications
- **Backup**: Automated PostgreSQL backups
- **GDPR Compliance**: Data deletion, export capabilities

### Accessibility Standards
- **WCAG 2.1 AA**: Full compliance
- **Keyboard Navigation**: All features keyboard accessible
- **Screen Readers**: ARIA labels and semantic HTML
- **Color Contrast**: 4.5:1 minimum ratio
- **Font Scaling**: Support 200% zoom
- **Focus Indicators**: Visible focus states
- **Error Messages**: Clear, actionable error guidance

### Browser and Device Support
- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Responsive**: 320px to 1920px width
- **Offline**: Service worker caching
- **PWA**: Progressive Web App capabilities

---

## User Experience Requirements

### Information Architecture

#### MVP Navigation Structure
```
Dashboard (Home)
├── Quick Stats Widget
├── Today's Events
├── Recent Activity
└── Action Buttons

Calendar
├── Month/Week/Day Views
├── Apartment Filters
├── Reservation Details
├── Add Reservation
└── Schedule Cleaning

Reservations
├── List View (sortable/filterable)
├── Add/Edit Reservation
├── Guest Management
├── Platform Indicators
└── Status Management

Apartments
├── Grid/List View
├── Add/Edit Apartment
├── Photo Gallery
├── Amenities
├── Access Codes
└── Maintenance Mode

Cleaning
├── Schedule View
├── Cleaner Management
├── Supply Tracking
├── Instructions
└── Status Updates

Statistics
├── Date Range Selector
├── Revenue Charts
├── Occupancy Rates
├── Platform Breakdown
└── Export Reports

Settings
├── Profile
├── Security
├── Notifications
├── Billing (V2.0)
└── Integrations (V2.0)
```


## Conclusion

This implementation specification provides a comprehensive blueprint for building VRBNBXOSS. The phased approach ensures rapid delivery of value while maintaining quality and scalability.

Key advantages of this Supabase-based approach:
- **Rapid Development**: Leveraging Supabase services accelerates development
- **Real-time Sync**: PostgreSQL with real-time subscriptions
- **Scalability**: PostgreSQL scales with proper indexing and caching
- **Cost-Effective**: More predictable pricing than Firebase
- **Security**: Row Level Security provides database-level protection
- **Flexibility**: Full SQL capabilities for complex queries

The 16-week implementation timeline delivers a production-ready MVP in 8 weeks, with advanced features following based on user feedback and market validation.

---

*This document serves as the definitive implementation guide for VRBNBXOSS development and should be referenced throughout the development lifecycle.*