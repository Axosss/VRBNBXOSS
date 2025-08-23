# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Development Workflow

### Project Structure
```
VRBNBXOSS/
├── VRBNBXOSS-backend/          # Containerized backend
│   ├── docker-compose.yml      # Local development
│   ├── scripts/build.sh        # Build automation
│   ├── config/                 # Configuration files
│   └── supabase/               # Edge Functions
├── design-documentation/       # Complete UX/UI specifications
├── project-documentation/      # Product requirements
└── tech-stack-pref.md         # Technology decisions
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