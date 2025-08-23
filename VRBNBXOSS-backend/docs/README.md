# VRBNBXOSS Backend Containerization

A comprehensive Docker containerization setup for the VRBNBXOSS rental property management backend, optimized for both development and production environments.

## 🏗️ Architecture Overview

This containerization setup supports:
- **Next.js 14 API Routes**: Containerized backend application
- **Supabase Integration**: Database, authentication, and real-time features
- **Edge Functions**: Custom business logic processing
- **Development Environment**: Local development with hot reloading
- **Production Deployment**: Optimized, secure production containers
- **Monitoring & Observability**: Health checks, metrics, and logging

## 📁 Directory Structure

```
forkcast-backend/
├── Dockerfile                          # Production-optimized multi-stage build
├── docker-compose.yml                  # Local development orchestration
├── docker-compose.prod.yml            # Production deployment
├── .env.example                        # Environment configuration template
├── .env.local.example                  # Local development template
├── docker/
│   └── Dockerfile.dev                  # Development-optimized container
├── scripts/
│   ├── build.sh                        # Automated build script
│   └── deploy.sh                       # Deployment automation
├── config/
│   ├── postgres/
│   │   └── init.sql                    # Database initialization
│   ├── security/
│   │   ├── nginx.conf                  # Reverse proxy configuration
│   │   ├── .dockerignore               # Build context exclusions
│   │   └── security-scan.sh            # Security analysis
│   ├── health/
│   │   ├── health-checks.ts            # Health monitoring implementation
│   │   └── api-routes.ts               # Health check API endpoints
│   └── monitoring/
│       └── docker-compose.monitoring.yml # Prometheus, Grafana setup
├── supabase/
│   └── functions/
│       ├── Dockerfile.edge             # Edge Functions container
│       ├── serve.ts                    # Local Edge Functions server
│       ├── image-optimization/         # Image processing
│       ├── pdf-generation/             # Document generation
│       ├── email-notification/         # Email automation
│       └── calendar-sync/              # Calendar integration
└── docs/
    └── README.md                       # This documentation
```

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- Node.js 18+ (for local development)
- Git

### 1. Clone and Setup

```bash
cd /path/to/vrbnbxoss/forkcast-backend
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

### 2. Local Development

```bash
# Start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build

# View logs
docker-compose logs -f app
```

**Services Available:**
- **Backend API**: http://localhost:3000
- **Database (PostgreSQL)**: localhost:5432
- **Redis Cache**: localhost:6379
- **Supabase Local**: http://localhost:54321
- **MailHog (Email Testing)**: http://localhost:8025
- **MinIO (S3 Storage)**: http://localhost:9001
- **Adminer (DB Admin)**: http://localhost:8080

### 3. Production Build

```bash
# Build production image
./scripts/build.sh prod

# Deploy to production
./scripts/deploy.sh
```

## 🔧 Configuration

### Environment Variables

#### Core Application
```bash
NODE_ENV=development|production
NEXT_PUBLIC_APP_NAME="VRBNBXOSS"
PORT=3000
```

#### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

#### Security & Encryption
```bash
APP_ENCRYPTION_KEY=your-32-character-encryption-key
NEXTAUTH_SECRET=your-nextauth-secret
```

#### External Services
```bash
# Email (Resend)
RESEND_API_KEY=re_your-resend-api-key

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### Docker Configuration

#### Development Settings
- **Hot Reloading**: Volume mounts for source code
- **Debug Mode**: Development tools included
- **Faster Builds**: Layer caching optimized for development

#### Production Settings
- **Multi-stage Build**: Minimal runtime image
- **Security**: Non-root user, minimal attack surface
- **Performance**: Optimized Node.js runtime
- **Health Checks**: Built-in monitoring endpoints

## 🏥 Health Monitoring

### Health Check Endpoints

- **Main Health**: `GET /api/health`
- **Liveness Probe**: `GET /api/health/live`
- **Readiness Probe**: `GET /api/health/ready`
- **Metrics**: `GET /api/health/metrics`

### Service Monitoring

The health check system monitors:
- ✅ Supabase connectivity
- ✅ Database connections
- ✅ Redis cache
- ✅ External API services
- ✅ File system access
- ✅ Memory usage

### Example Health Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 12450000,
  "services": {
    "supabase": {
      "status": "healthy",
      "responseTime": 45
    },
    "redis": {
      "status": "healthy",
      "responseTime": 12
    }
  }
}
```

## 🔒 Security Features

### Container Security
- ✅ **Non-root User**: Runs as `nextjs` user (UID 1001)
- ✅ **Multi-stage Build**: Minimal attack surface
- ✅ **Secret Management**: Environment-based configuration
- ✅ **Read-only Filesystem**: Immutable container runtime
- ✅ **Health Checks**: Built-in monitoring

### Network Security
- ✅ **Reverse Proxy**: Nginx with security headers
- ✅ **Rate Limiting**: API and authentication endpoints
- ✅ **HTTPS Only**: Production SSL termination
- ✅ **CORS Configuration**: Restricted cross-origin access
- ✅ **Content Security Policy**: XSS protection

### Security Scanning

```bash
# Run comprehensive security scan
./config/security/security-scan.sh

# Quick vulnerability check
./config/security/security-scan.sh quick
```

## 🔨 Build & Deployment

### Build Scripts

#### Development Build
```bash
./scripts/build.sh dev
```

#### Production Build
```bash
./scripts/build.sh prod
```

#### Build Options
```bash
# Custom registry
DOCKER_REGISTRY=your-registry.com ./scripts/build.sh prod

# Custom version
VERSION=1.2.3 ./scripts/build.sh prod

# Security scan included
./scripts/build.sh prod
```

### Deployment Strategies

#### Simple Deployment
```bash
./scripts/deploy.sh
```

#### Rolling Deployment
```bash
DEPLOY_STRATEGY=rolling ./scripts/deploy.sh
```

#### Blue-Green Deployment
```bash
DEPLOY_STRATEGY=blue-green ./scripts/deploy.sh
```

### Environment-Specific Deployment

#### Staging
```bash
ENVIRONMENT=staging ./scripts/deploy.sh
```

#### Production
```bash
ENVIRONMENT=production BACKUP_BEFORE_DEPLOY=true ./scripts/deploy.sh
```

## 🔍 Monitoring & Observability

### Monitoring Stack

Start complete monitoring:
```bash
docker-compose -f config/monitoring/docker-compose.monitoring.yml up -d
```

**Services:**
- **Prometheus**: http://localhost:9090 (metrics collection)
- **Grafana**: http://localhost:3001 (dashboards)
- **AlertManager**: http://localhost:9093 (alerting)

### Key Metrics

- **Application Performance**: Response times, error rates
- **Container Resources**: CPU, memory, disk usage
- **Database Performance**: Query times, connections
- **External Services**: API response times, error rates

### Log Aggregation

```bash
# View application logs
docker-compose logs -f app

# View all service logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f postgres redis
```

## 🧪 Supabase Edge Functions

### Local Development

```bash
# Start Edge Functions server
cd supabase/functions
docker build -f Dockerfile.edge -t vrbnbxoss-edge .
docker run -p 8000:8000 vrbnbxoss-edge
```

### Available Functions

1. **Image Optimization** (`/image-optimization`)
   - Resize and compress apartment photos
   - Format conversion (WebP, JPEG, PNG)
   - Storage integration

2. **PDF Generation** (`/pdf-generation`)
   - Rental agreements
   - Invoices
   - Cleaning checklists

3. **Email Notifications** (`/email-notification`)
   - Booking confirmations
   - Check-in instructions
   - Automated reminders

4. **Calendar Sync** (`/calendar-sync`)
   - iCal import/export
   - Platform synchronization
   - Availability management

### Function Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test image optimization
curl -X POST http://localhost:8000/image-optimization \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/image.jpg"}'

# Test PDF generation
curl -X POST http://localhost:8000/pdf-generation \
  -H "Content-Type: application/json" \
  -d '{"type": "rental-agreement", "data": {...}}'
```

## 🐛 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Check health
curl http://localhost:3000/api/health
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready

# Check connection
docker-compose exec app node -e "console.log(process.env.DATABASE_URL)"
```

#### Permission Issues
```bash
# Check user in container
docker-compose exec app whoami

# Check file permissions
docker-compose exec app ls -la /app
```

### Performance Issues

#### Memory Usage
```bash
# Check container stats
docker stats

# Check application memory
curl http://localhost:3000/api/health | jq '.services.memory'
```

#### Slow Builds
```bash
# Use build cache
docker-compose build --parallel

# Clean build cache
docker system prune -f
```

### Debug Mode

```bash
# Run with debug output
DEBUG=app:* docker-compose up

# Execute into running container
docker-compose exec app sh
```

## 📖 Best Practices

### Development
- Use volume mounts for hot reloading
- Keep development and production environments similar
- Use `.env.local` for local overrides
- Regular security scanning

### Production
- Use multi-stage builds for smaller images
- Implement proper health checks
- Set up monitoring and alerting
- Regular backups and disaster recovery testing
- Use secrets management for sensitive data

### Security
- Never commit secrets to version control
- Use non-root users in containers
- Implement proper CORS policies
- Regular vulnerability scanning
- Network segmentation

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review container logs: `docker-compose logs`
3. Check health endpoints: `curl http://localhost:3000/api/health`
4. Run security scan: `./config/security/security-scan.sh`

## 📝 License

This containerization setup is part of the VRBNBXOSS project.