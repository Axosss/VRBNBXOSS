# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Git Commit Guidelines
- Please use Conventional Commits formatting for git commits.
- Please use Conventional Branch naming (prefix-based branch naming convention)
- Please do not mention yourself (Claude) as a co-author when committing, or include any links to Claude Code

## Visual Development Memories
- Please use the playwright MCP server when making visual changes to the front-end to check your work
## Guidance Memories
- Please ask for clarification upfront, upon the initial prompts, when you need more direction.
## Linting and Code Quality
- Please run 'npm run lint' after completing large additions or refactors to ensure adherence to syntactic best practices.
## CLI Tooling Memories
- Please use the 'gh' CLI tool when appropriate, create issues, open pull requests, read comments, etc.
## Documentation Memories
- Please use context to find the relevant, up-to-date documentation when working with 3rd party libraries, packages, frameworks, etc as needed.

## Project Overview
VRBNBXOSS is a comprehensive rental property management dashboard for property owners managing multiple apartments across Airbnb, VRBO, and direct bookings. The system helps track reservations, schedule cleanings, manage guest information, and analyze business performance.

## Architecture
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Edge Functions, Storage)
- **Hosting**: Vercel for frontend, containerized backend with Docker
- **Real-time**: Supabase Realtime for live updates
- **Database**: PostgreSQL with Row Level Security (RLS)


## Key Commands

### Docker Development
```bash
# Build development environment
cd VRBNBXOSS-backend
./scripts/build.sh dev

# Start all services locally
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Production build
./scripts/build.sh prod

# Deploy to production
./scripts/deploy.sh
```

### Available Services (Docker Development)
- Backend API: http://localhost:3000
- Database (PostgreSQL): localhost:5432
- Redis Cache: localhost:6379
- Supabase Local: http://localhost:54321
- MailHog (Email Testing): http://localhost:8025
- MinIO (S3 Storage): http://localhost:9001
- Adminer (DB Admin): http://localhost:8080

### Testing & Quality
```bash
# Security scan
./config/security/security-scan.sh

# Health check
curl http://localhost:3000/api/health
```

## Database Schema Structure

### Core Tables
- `profiles` - User profiles extending auth.users
- `apartments` - Property information with encrypted access codes
- `reservations` - Bookings across platforms (Airbnb, VRBO, Direct)
- `guests` - Guest information with encrypted sensitive data
- `cleanings` - Cleaning schedules linked to reservations
- `cleaners` - Cleaner profiles and rates
- `contracts` - Generated documents and legal agreements (V2.0)

### Row Level Security
All tables implement RLS policies ensuring users only access their own data. Key patterns:
- Owner-based access: `auth.uid() = owner_id`
- Relationship-based access: Through foreign key references
- Encrypted sensitive data: Access codes, ID documents

## MVP Feature Set

### Core Features (P0)
1. **Authentication** - Supabase Auth with email/password and OAuth
2. **Apartment Management** - Property profiles with photos and amenities
3. **Calendar Management** - Unified reservation view across apartments
4. **Reservation Management** - Platform-specific booking management
5. **Cleaning Schedule** - Cleaning coordination between bookings
6. **Basic Statistics** - Revenue and occupancy analytics

### V2.0 Features
- Platform Integration (iCal sync)
- Contract Generation
- Guest Portal
- Automated Communications
- WhatsApp Bot

## Important Implementation Notes

### Security Requirements
- All sensitive data must be encrypted at database level
- Row Level Security policies enforce data isolation
- Never commit secrets or API keys to repository
- Use Supabase service role key only for server-side operations

### Data Validation
- Database triggers validate business logic (no double-booking)
- PostgreSQL constraints ensure data integrity
- Real-time subscriptions provide live updates
- State transitions managed via database triggers

### Performance Considerations
- PostgreSQL queries optimized with proper indexing
- Real-time subscriptions limited to prevent memory leaks
- Image optimization via Supabase Edge Functions
- Efficient pagination for large datasets

### Data Mapping Architecture
**Current Implementation (as of Aug 2025):**
- Database uses snake_case naming convention (PostgreSQL standard)
- Frontend uses camelCase naming convention (TypeScript/JavaScript standard)
- Data mappers in `/src/lib/mappers/` handle conversions

**API Design Pattern:**
- **CREATE operations**: Frontend uses mapper to convert camelCase to snake_case before sending to API
- **UPDATE operations**: Frontend sends camelCase directly; API handles conversion internally
  - Validation schemas expect camelCase input
  - API routes manually convert to snake_case for database operations
  - This inconsistency is intentional for now - working but could be unified in future
- **READ operations**: API uses mappers to convert snake_case responses to camelCase
- **DELETE operations**: Simple ID-based operations, no mapping needed

**Rationale**: This mixed approach allows the API to accept frontend-friendly camelCase while maintaining database conventions. The inconsistency between CREATE (uses mapper) and UPDATE (doesn't use mapper) is a known technical debt that can be addressed when refactoring the API layer.

## Development Workflow

### Project Structure
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication routes group
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx       # Auth layout wrapper
│   │
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── layout.tsx       # Dashboard layout with sidebar
│   │   ├── page.tsx         # Dashboard home
│   │   ├── calendar/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   ├── reservations/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── apartments/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── edit/
│   │   │   └── new/
│   │   ├── cleaning/
│   │   │   ├── page.tsx
│   │   │   └── schedule/
│   │   ├── guests/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   ├── statistics/
│   │   │   ├── page.tsx
│   │   │   └── reports/
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── profile/
│   │       ├── billing/
│   │       └── integrations/
│   │
│   ├── (public)/            # Public routes
│   │   ├── guest-portal/
│   │   │   └── [token]/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── api/                 # API Routes
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   └── logout/
│   │   ├── reservations/
│   │   ├── apartments/
│   │   ├── cleaning/
│   │   ├── webhooks/
│   │   │   ├── stripe/
│   │   │   └── calendar-sync/
│   │   └── cron/
│   │       ├── daily-sync/
│   │       └── send-reminders/
│   │
│   ├── layout.tsx           # Root layout
│   ├── globals.css         # Global styles
│   └── providers.tsx       # Client providers wrapper
│
├── components/
│   ├── ui/                  # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   │
│   ├── layout/              # Layout components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── mobile-nav.tsx
│   │   └── footer.tsx
│   │
│   ├── calendar/            # Calendar components
│   │   ├── calendar-view.tsx
│   │   ├── reservation-card.tsx
│   │   ├── cleaning-block.tsx
│   │   └── availability-indicator.tsx
│   │
│   ├── forms/               # Form components
│   │   ├── reservation-form.tsx
│   │   ├── apartment-form.tsx
│   │   ├── guest-form.tsx
│   │   └── cleaning-form.tsx
│   │
│   ├── charts/              # Chart components
│   │   ├── revenue-chart.tsx
│   │   ├── occupancy-chart.tsx
│   │   └── platform-breakdown.tsx
│   │
│   └── shared/              # Shared components
│       ├── data-table.tsx
│       ├── loading-spinner.tsx
│       ├── error-boundary.tsx
│       └── empty-state.tsx
│
├── lib/
│   ├── supabase/            # Supabase client and utilities
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server client
│   │   ├── middleware.ts    # Auth middleware
│   │   └── types.ts         # Generated types
│   │
│   ├── api/                 # API utilities
│   │   ├── reservations.ts
│   │   ├── apartments.ts
│   │   ├── cleaning.ts
│   │   └── statistics.ts
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-reservations.ts
│   │   ├── use-apartments.ts
│   │   └── use-realtime.ts
│   │
│   ├── utils/               # Utility functions
│   │   ├── dates.ts
│   │   ├── currency.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   │
│   └── store/               # Zustand stores
│       ├── auth-store.ts
│       ├── ui-store.ts
│       └── filter-store.ts
│
├── styles/
│   ├── globals.css          # Global styles and Tailwind
│   └── themes/              # Theme configurations
│
├── types/                   # TypeScript type definitions
│   ├── index.ts
│   ├── apartment.ts
│   ├── reservation.ts
│   ├── guest.ts
│   └── cleaning.ts
│
├── public/                  # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── tests/                   # Test files
    ├── unit/
    ├── integration/
    └── e2e/
```

### Backend Structure (Supabase)
```
supabase/
├── migrations/              # Database migrations
│   ├── 00001_initial_schema.sql
│   ├── 00002_create_apartments.sql
│   ├── 00003_create_reservations.sql
│   └── ...
│
├── functions/              # Edge Functions
│   ├── generate-contract/
│   │   └── index.ts
│   ├── sync-calendar/
│   │   └── index.ts
│   ├── send-notification/
│   │   └── index.ts
│   └── calculate-stats/
│       └── index.ts
│
├── seed/                   # Seed data
│   └── seed.sql
│
└── config.toml            # Supabase configuration
```

### Docker Setup
```
docker/
├── docker-compose.yml      # Local development setup
├── Dockerfile.dev         # Development container
└── .env.example          # Environment variables template
```

---

## Navigation Structure

### Main Navigation
```
Dashboard
├── Overview (/)
│   ├── Today's Schedule
│   ├── Revenue Summary
│   ├── Recent Activity
│   └── Quick Actions
│
├── Calendar (/calendar)
│   ├── Month View
│   ├── Week View
│   ├── Day View
│   └── Filters Panel
│
├── Reservations (/reservations)
│   ├── All Reservations
│   ├── Upcoming
│   ├── In Progress
│   ├── Completed
│   └── Cancelled
│
├── Apartments (/apartments)
│   ├── All Properties
│   ├── Active
│   ├── Maintenance
│   └── Add New
│
├── Cleaning (/cleaning)
│   ├── Schedule
│   ├── Cleaners
│   ├── Supplies
│   └── Instructions
│
├── Guests (/guests)
│   ├── All Guests
│   ├── Current
│   ├── Previous
│   └── Blacklist
│
├── Analytics (/statistics)
│   ├── Revenue
│   ├── Occupancy
│   ├── Platform Performance
│   └── Reports
│
└── Settings (/settings)
    ├── Profile
    ├── Security
    ├── Notifications
    ├── Billing
    ├── Integrations
    └── API Keys
```

### Environment Configuration
Essential environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side operations
- `APP_ENCRYPTION_KEY` - 32-character encryption key

### Design System
The project includes comprehensive design documentation with:
- Complete UI component specifications
- Accessibility guidelines (WCAG 2.1 AA)
- Design tokens for consistent styling
- User journey flows for all features

### Common Development Tasks
1. **Adding New Features**: Follow MVP→V2.0 phased approach
2. **Database Changes**: Use Supabase migrations
3. **Authentication**: Leverage existing RLS policies
4. **File Uploads**: Use Supabase Storage with Edge Functions
5. **Real-time Updates**: Implement Supabase Realtime subscriptions

## Business Logic Constraints

### Reservation Management
- Prevent double-booking via PostgreSQL transactions
- Validate guest count against apartment capacity
- Enforce check-out > check-in date constraints
- Support platform-specific fields (Airbnb vs VRBO vs Direct)

### Cleaning Scheduling
- Auto-create cleaning needs on checkout
- Validate cleaner availability
- Handle same-day turnovers with conflict detection
- Support recurring cleaning schedules

### Multi-Platform Support
Each reservation platform has specific requirements:
- **Airbnb**: Platform reservation ID, specific guest info format
- **VRBO**: Different iCal format, pricing structure
- **Direct**: Full guest documentation (ID, address) for legal compliance

This project prioritizes operational efficiency for property owners while maintaining data security and providing real-time collaborative features.