# Multi-stage production Dockerfile for VRBNBXOSS Backend
# Optimized for Next.js 14 API routes and Supabase integration

# ==========================================
# Base Stage - Common dependencies
# ==========================================
FROM node:18-alpine AS base

# Install necessary system dependencies
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    curl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

WORKDIR /app

# ==========================================
# Dependencies Stage - Install packages
# ==========================================
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with npm ci for faster, reliable, reproducible builds
RUN \
    if [ -f package-lock.json ]; then npm ci --only=production; \
    else echo "Warning: Lockfile not found. Running npm install" && npm install --only=production; \
    fi

# ==========================================
# Builder Stage - Build application
# ==========================================
FROM base AS builder

WORKDIR /app

# Copy package files and dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NODE_ENV=production

# Build Next.js application
RUN npm run build

# ==========================================
# Production Stage - Final runtime image
# ==========================================
FROM base AS production

WORKDIR /app

# Create app directory with correct permissions
RUN mkdir -p /app && chown -R nextjs:nodejs /app

# Copy runtime dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

# Copy additional configuration files if they exist
COPY --from=builder --chown=nextjs:nodejs /app/supabase ./supabase
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json* ./

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Expose port
EXPOSE 3000

# Switch to non-root user for security
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]