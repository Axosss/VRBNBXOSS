# VRBNBXOSS - Rental Property Management Dashboard

A comprehensive rental property management dashboard built with Next.js 14, Supabase, and TypeScript.

## Features

### MVP (Currently Implemented)
- ✅ **Authentication System** - Email/password and OAuth (Google, Facebook)
- ✅ **User Profile Management** - Complete profile CRUD with settings
- ✅ **Apartment Management** - Property CRUD with photo upload
- ✅ **Database Foundation** - PostgreSQL with Row Level Security
- ✅ **Photo Upload** - Supabase Storage integration with validation
- ✅ **Security** - Database-level authorization and encrypted sensitive data
- ✅ **API Routes** - RESTful endpoints with comprehensive validation

### Coming Soon
- 🔄 **Reservation Management** - Multi-platform booking system
- 🔄 **Cleaning Scheduling** - Automated cleaning coordination
- 🔄 **Calendar Integration** - Unified reservation calendar
- 🔄 **Statistics Dashboard** - Revenue and occupancy analytics

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Validation**: Zod schemas for type-safe inputs
- **Authentication**: Supabase Auth with OAuth support
- **File Storage**: Supabase Storage with automatic optimization
- **Security**: Row Level Security, encrypted sensitive data

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Docker (for local Supabase development)

### 1. Clone and Install

```bash
cd vrbnbxoss-app
npm install
```

### 2. Supabase Setup

#### Option A: Local Development with Docker
```bash
# Start local Supabase
npm run db:start

# Apply migrations
npm run db:migrate

# Generate TypeScript types
npm run db:types
```

#### Option B: Cloud Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and API keys
3. Update `.env.local` with your credentials

### 3. Environment Variables

Copy `.env.example` to `.env.local` and update:

```bash
# Required - Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required - Encryption
APP_ENCRYPTION_KEY=your_32_character_encryption_key

# Optional - OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/callback` - OAuth callback

### Profile Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Apartment Management
- `GET /api/apartments` - List apartments (with pagination/filters)
- `POST /api/apartments` - Create apartment
- `GET /api/apartments/[id]` - Get apartment details
- `PUT /api/apartments/[id]` - Update apartment
- `DELETE /api/apartments/[id]` - Delete apartment (soft delete)
- `POST /api/apartments/[id]/photos` - Upload apartment photo
- `DELETE /api/apartments/[id]/photos` - Delete apartment photo

### System
- `GET /api/health` - Health check endpoint

## Database Schema

### Core Tables
- **profiles** - User profiles extending Supabase auth.users
- **apartments** - Property information with encrypted access codes
- **reservations** - Bookings across platforms with overlap prevention
- **guests** - Guest information with encrypted PII
- **cleanings** - Cleaning schedules linked to reservations
- **cleaners** - Service provider information

### Security Features
- **Row Level Security (RLS)** - Database-level authorization
- **Encrypted Fields** - Access codes and sensitive data
- **Audit Logging** - Automatic change tracking
- **Business Logic Triggers** - Double-booking prevention

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:start        # Start local Supabase
npm run db:migrate      # Apply migrations
npm run db:reset        # Reset database
npm run db:types        # Generate TypeScript types
npm run db:status       # Check Supabase status

# Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking
```

## Project Structure

```
src/
├── app/
│   ├── api/                # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── profile/       # Profile management
│   │   ├── apartments/    # Apartment CRUD
│   │   └── health/        # Health check
│   └── layout.tsx         # Root layout
├── lib/
│   ├── supabase/          # Supabase client configuration
│   ├── validations.ts     # Zod validation schemas
│   └── utils.ts           # Utility functions
└── components/            # React components (coming soon)
```

## Security Best Practices

### Implemented
- ✅ Row Level Security on all tables
- ✅ Input validation with Zod schemas
- ✅ Encrypted sensitive data storage
- ✅ Secure file upload with type/size validation
- ✅ Authentication middleware for protected routes
- ✅ SQL injection prevention with parameterized queries

### Database Triggers
- ✅ Auto-profile creation on user registration
- ✅ Double-booking prevention
- ✅ Automatic timestamp updates
- ✅ Business logic validation

## Contributing

1. Follow the existing code structure and patterns
2. All API endpoints must include proper validation
3. Use TypeScript strictly - no `any` types
4. Add comprehensive error handling
5. Follow the security patterns established

## License

Private project - All rights reserved.