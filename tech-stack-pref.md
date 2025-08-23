# VRBNBXOSS Tech Stack Documentation

## Overview
This document outlines the technology stack for VRBNBXOSS - a comprehensive rental property management dashboard. The stack prioritizes developer experience, scalability, cost-effectiveness, and modern best practices.

---

## Frontend Stack

### Core Framework
- **Next.js 14** - Full-stack React framework with App Router
  - Server-side rendering for SEO and performance
  - API routes for backend logic
  - Built-in optimization and code splitting
- **TypeScript** - Type safety and better developer experience
  - Catches errors at compile time
  - Improved IDE support and autocomplete
  - Self-documenting code
- **React 18** - UI library (included with Next.js)
  - Component-based architecture
  - Large ecosystem and community

### Data Flow & State Management
- **Zustand** - Lightweight state management
  - Simple API without boilerplate
  - TypeScript support out of the box
  - Perfect for client-side state (UI state, user preferences)
- **TanStack Query (React Query)** - Server state management
  - Automatic caching and background refetching
  - Optimistic updates for better UX
  - Built-in loading and error states
- **React Hook Form** - Form state management
  - High performance with minimal re-renders
  - Built-in validation
  - Works great with TypeScript

### UI, Styling & Components
- **Tailwind CSS** - Utility-first CSS framework
  - Rapid development with utility classes
  - Consistent design system
  - Tree-shaking for small bundle size
- **shadcn/ui** - Radix UI + Tailwind component library
  - Accessible components by default
  - Customizable and owned code
  - Copy-paste approach (no dependencies)
- **Framer Motion** - Animation library
  - Smooth, performant animations
  - Gesture support
  - Layout animations for transitions

### Charts & Data Visualization
- **Recharts** - Composable charting library
  - Built on React components
  - Responsive and customizable
  - Good for dashboards and analytics

### Date & Time Handling
- **date-fns** - Modern date utility library
  - Modular and tree-shakeable
  - Immutable and functional
  - Timezone support with date-fns-tz

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks

---

## Backend Stack

### Database & Authentication
- **Supabase** - Open-source Firebase alternative
  - **PostgreSQL Database** - Relational database perfect for complex queries
  - **Authentication** - Built-in auth with multiple providers
  - **Row Level Security (RLS)** - Database-level security
  - **Real-time Subscriptions** - Live updates via WebSockets
  - **Storage** - File storage for images and documents
  - **Edge Functions** - Serverless functions for complex logic

### API Layer
- **Next.js API Routes** - Serverless API endpoints
  - Co-located with frontend code
  - Automatic API routing
  - TypeScript support
- **tRPC** (Optional) - End-to-end typesafe APIs
  - Type safety from backend to frontend
  - No code generation needed
  - RPC-like developer experience

### Background Jobs & Scheduling
- **Vercel Cron Jobs** - Scheduled tasks
  - Simple cron syntax
  - Integrated with Vercel platform
  - Perfect for daily syncs and cleanups
- **QStash** (by Upstash) - Message queue for complex workflows
  - Reliable message delivery
  - Retry logic built-in
  - Good for email scheduling

### External Services

#### Communication
- **Resend** - Transactional email service
  - React email templates
  - Great developer experience
  - Reliable delivery
- **Twilio** - SMS and WhatsApp integration
  - Global SMS delivery
  - WhatsApp Business API
  - Programmable messaging

#### File Processing
- **Vercel Blob** - File storage
  - Integrated with Vercel
  - Global CDN
  - Simple API
- **Sharp** - Image processing
  - Fast image optimization
  - Resize and format conversion
  - Works in serverless environment

#### Payments (V2.0)
- **Stripe** - Payment processing
  - Industry standard
  - Great documentation
  - Handles compliance

---

## Infrastructure & DevOps

### Hosting & Deployment
- **Vercel** - Frontend and API hosting
  - Automatic deployments from Git
  - Global edge network
  - Preview deployments for PRs
  - Serverless functions
  - Analytics and Web Vitals

### Local Development
- **Docker** - Containerized development environment
  - Consistent environment across team
  - Easy onboarding
  - Matches production environment
- **Docker Compose** - Multi-container orchestration
  - Run entire stack locally
  - Database, cache, and services

### Monitoring & Error Tracking
- **Sentry** - Error tracking and performance monitoring
  - Real-time error alerts
  - Performance tracking
  - Session replay for debugging
  - Release tracking
- **Vercel Analytics** - Web analytics
  - Core Web Vitals
  - Audience insights
  - No cookie banner needed

### CI/CD
- **GitHub Actions** - Continuous Integration
  - Automated testing
  - Linting and type checking
  - Build verification
- **Vercel** - Continuous Deployment
  - Automatic deployments on push
  - Preview deployments for PRs
  - Rollback capabilities

### Testing
- **Vitest** - Unit testing
  - Fast and modern
  - Jest-compatible API
  - Native ESM support
- **Playwright** - E2E testing
  - Cross-browser testing
  - Visual regression testing
  - API testing capabilities
- **React Testing Library** - Component testing
  - User-centric testing
  - Works with Vitest
  - Accessibility testing

---

## Project Structure

### Frontend Structure
```
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

### User Flows
```
Guest Booking Flow:
1. Calendar View → 2. Select Dates → 3. Add Reservation → 4. Guest Details → 5. Confirmation

Cleaning Scheduling:
1. Calendar View → 2. Identify Gap → 3. Schedule Cleaning → 4. Assign Cleaner → 5. Send Instructions

Property Setup:
1. Apartments → 2. Add New → 3. Basic Info → 4. Amenities → 5. Photos → 6. Access Codes → 7. Activate
```

---

## Database Schema (PostgreSQL/Supabase)

### Core Tables
```sql
-- Users table (managed by Supabase Auth)
auth.users

-- Custom user profiles
public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'owner',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Apartments
public.apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  address JSONB NOT NULL,
  capacity INTEGER NOT NULL,
  bedrooms INTEGER,
  bathrooms DECIMAL,
  amenities TEXT[],
  photos TEXT[],
  access_codes JSONB, -- Encrypted
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Reservations
public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID REFERENCES apartments(id),
  guest_id UUID REFERENCES guests(id),
  platform TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_count INTEGER NOT NULL,
  total_price DECIMAL NOT NULL,
  status TEXT DEFAULT 'confirmed',
  platform_reservation_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Guests
public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  id_document TEXT, -- Encrypted
  address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Cleaning schedules
public.cleanings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID REFERENCES apartments(id),
  cleaner_id UUID REFERENCES cleaners(id),
  reservation_id UUID REFERENCES reservations(id),
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration INTERVAL,
  status TEXT DEFAULT 'scheduled',
  instructions TEXT,
  supplies JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Cleaners
public.cleaners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  rate DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="VRBNBXOSS"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# External Services
RESEND_API_KEY=your-resend-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-public-sentry-dsn

# Vercel (auto-injected)
VERCEL_URL=
VERCEL_ENV=
```

---

## Development Workflow

### Getting Started
```bash
# Clone repository
git clone https://github.com/yourusername/vrbnbxoss.git

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Start development server
npm run dev

# Or use Docker
docker-compose up
```

### Git Workflow
```bash
main
├── develop
│   ├── feature/calendar-view
│   ├── feature/reservation-form
│   └── fix/date-validation
└── release/v1.0.0
```

### Deployment Pipeline
1. Push to GitHub
2. GitHub Actions run tests
3. Vercel creates preview deployment
4. Manual review
5. Merge to main
6. Automatic production deployment

---

## Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **API Response Time**: < 200ms p95
- **Database Query Time**: < 50ms p95
- **Image Load Time**: < 2s on 3G

---

## Security Considerations

- **Authentication**: Supabase Auth with MFA support
- **Authorization**: Row Level Security (RLS) policies
- **Data Encryption**: TLS in transit, encrypted at rest
- **API Security**: Rate limiting, CORS configuration
- **Input Validation**: Zod schemas for all inputs
- **XSS Prevention**: React's built-in protections
- **CSRF Protection**: SameSite cookies
- **Secrets Management**: Environment variables, never in code

---

## Cost Analysis

### Monthly Estimates (at scale)
- **Vercel**: $20 (Pro plan)
- **Supabase**: $25 (Pro plan)
- **Sentry**: $26 (Team plan)
- **Resend**: $20 (10k emails)
- **Total**: ~$91/month

### Free Tier Limits
- **Vercel**: Hobby plan free
- **Supabase**: 500MB database, 2GB storage
- **Sentry**: 5k errors/month
- **Resend**: 100 emails/day

---

## Future Considerations

### Potential Additions
- **Redis** - Caching layer if needed
- **Elasticsearch** - Advanced search capabilities
- **Temporal** - Complex workflow orchestration
- **Segment** - Analytics and data pipeline
- **Cloudflare** - CDN and DDoS protection

### Scaling Considerations
- Database read replicas
- Horizontal scaling with load balancer
- Microservices architecture
- Event-driven architecture with message queues
- Multi-region deployment

---

*This document should be reviewed and updated quarterly to ensure it reflects current best practices and project needs.*