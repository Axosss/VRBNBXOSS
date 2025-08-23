#!/bin/bash

# VRBNBXOSS Backend Deployment Script
# Automated deployment with zero-downtime rolling updates

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="vrbnbxoss"
ENVIRONMENT="${ENVIRONMENT:-production}"
DEPLOY_STRATEGY="${DEPLOY_STRATEGY:-rolling}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"
BACKUP_BEFORE_DEPLOY="${BACKUP_BEFORE_DEPLOY:-true}"

echo -e "${BLUE}🚀 VRBNBXOSS Backend Deployment Script${NC}"
echo -e "${BLUE}=====================================${NC}"
echo "Environment: $ENVIRONMENT"
echo "Strategy: $DEPLOY_STRATEGY"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking deployment prerequisites...${NC}"
    
    # Check if environment file exists
    if [[ ! -f ".env" && ! -f ".env.${ENVIRONMENT}" ]]; then
        print_error "Environment configuration not found (.env or .env.${ENVIRONMENT})"
    fi
    print_status "Environment configuration found"
    
    # Check if deployment files exist
    if [[ ! -f "docker-compose.yml" ]]; then
        print_error "docker-compose.yml not found"
    fi
    print_status "Docker Compose configuration found"
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
    fi
    print_status "Docker daemon is running"
    
    echo ""
}

# Load environment configuration
load_environment() {
    echo -e "${BLUE}🔧 Loading environment configuration...${NC}"
    
    # Load environment-specific config
    if [[ -f ".env.${ENVIRONMENT}" ]]; then
        set -o allexport
        source ".env.${ENVIRONMENT}"
        set +o allexport
        print_status "Loaded .env.${ENVIRONMENT}"
    elif [[ -f ".env" ]]; then
        set -o allexport
        source ".env"
        set +o allexport
        print_status "Loaded .env"
    fi
    
    echo ""
}

# Pre-deployment backup
create_backup() {
    if [[ "$BACKUP_BEFORE_DEPLOY" == "true" && "$ENVIRONMENT" == "production" ]]; then
        echo -e "${BLUE}💾 Creating pre-deployment backup...${NC}"
        
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup database (if using local PostgreSQL)
        if docker-compose ps | grep -q postgres; then
            docker-compose exec -T postgres pg_dump -U postgres vrbnbxoss_prod > "$BACKUP_DIR/database.sql"
            print_status "Database backup created"
        fi
        
        # Backup uploaded files (if using local storage)
        if [[ -d "uploads" ]]; then
            tar -czf "$BACKUP_DIR/uploads.tar.gz" uploads/
            print_status "File uploads backup created"
        fi
        
        # Save current docker-compose state
        docker-compose config > "$BACKUP_DIR/docker-compose.backup.yml"
        print_status "Configuration backup created"
        
        echo "Backup created at: $BACKUP_DIR"
        echo ""
    fi
}

# Health check function
check_health() {
    local url="$1"
    local timeout="$2"
    local start_time=$(date +%s)
    
    echo "Checking health at $url..."
    
    while true; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            return 0
        fi
        
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -gt $timeout ]]; then
            return 1
        fi
        
        echo -n "."
        sleep 5
    done
}

# Rolling deployment strategy
deploy_rolling() {
    echo -e "${BLUE}🔄 Performing rolling deployment...${NC}"
    
    # Pull latest images
    echo "Pulling latest images..."
    docker-compose pull
    print_status "Images pulled"
    
    # Scale up new instances
    echo "Scaling up new instances..."
    docker-compose up -d --scale app=2 --no-recreate
    
    # Wait for new instances to be healthy
    echo "Waiting for new instances to become healthy..."
    if ! check_health "http://localhost:3000/api/health/ready" "$HEALTH_CHECK_TIMEOUT"; then
        print_error "New instances failed health check"
    fi
    print_status "New instances are healthy"
    
    # Remove old instances
    echo "Removing old instances..."
    docker-compose up -d --scale app=1
    print_status "Old instances removed"
    
    # Final health check
    if ! check_health "http://localhost:3000/api/health" 30; then
        print_error "Final health check failed"
    fi
    print_status "Rolling deployment completed successfully"
    
    echo ""
}

# Blue-green deployment strategy
deploy_blue_green() {
    echo -e "${BLUE}🔵🟢 Performing blue-green deployment...${NC}"
    
    # This is a simplified blue-green deployment
    # In production, you'd use a load balancer to switch traffic
    
    # Deploy to "green" environment
    echo "Deploying to green environment..."
    docker-compose -f docker-compose.yml -f docker-compose.green.yml up -d
    
    # Health check green environment
    echo "Health checking green environment..."
    if ! check_health "http://localhost:3001/api/health" "$HEALTH_CHECK_TIMEOUT"; then
        print_error "Green environment failed health check"
    fi
    print_status "Green environment is healthy"
    
    # Switch traffic (in production, this would be done at load balancer level)
    echo "Switching traffic to green environment..."
    docker-compose -f docker-compose.yml down
    docker-compose -f docker-compose.yml -f docker-compose.green.yml up -d
    
    print_status "Blue-green deployment completed successfully"
    echo ""
}

# Simple deployment strategy
deploy_simple() {
    echo -e "${BLUE}📦 Performing simple deployment...${NC}"
    
    # Stop services
    echo "Stopping services..."
    docker-compose down
    print_status "Services stopped"
    
    # Pull latest images
    echo "Pulling latest images..."
    docker-compose pull
    print_status "Images pulled"
    
    # Start services
    echo "Starting services..."
    docker-compose up -d
    print_status "Services started"
    
    # Health check
    echo "Performing health check..."
    if ! check_health "http://localhost:3000/api/health" "$HEALTH_CHECK_TIMEOUT"; then
        print_error "Health check failed"
    fi
    print_status "Health check passed"
    
    print_status "Simple deployment completed successfully"
    echo ""
}

# Run post-deployment tasks
post_deployment_tasks() {
    echo -e "${BLUE}🔧 Running post-deployment tasks...${NC}"
    
    # Database migrations (if needed)
    if command -v npx &> /dev/null && [[ -f "package.json" ]]; then
        echo "Running database migrations..."
        docker-compose exec app npx supabase db push || print_warning "Migration command not available"
    fi
    
    # Clear caches
    echo "Clearing application caches..."
    if docker-compose ps | grep -q redis; then
        docker-compose exec redis redis-cli FLUSHALL > /dev/null || true
        print_status "Redis cache cleared"
    fi
    
    # Warm up application
    echo "Warming up application..."
    curl -s http://localhost:3000/api/health > /dev/null || true
    curl -s http://localhost:3000/api/health/ready > /dev/null || true
    print_status "Application warmed up"
    
    echo ""
}

# Generate deployment report
generate_report() {
    echo -e "${BLUE}📊 Generating deployment report...${NC}"
    
    REPORT_FILE="deploy-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# VRBNBXOSS Backend Deployment Report

**Date:** $(date)
**Environment:** $ENVIRONMENT  
**Strategy:** $DEPLOY_STRATEGY
**Status:** Success ✅

## Deployment Details

- **Started:** $(date)
- **Environment:** $ENVIRONMENT
- **Strategy:** $DEPLOY_STRATEGY
- **Health Check Timeout:** ${HEALTH_CHECK_TIMEOUT}s

## Services Status

$(docker-compose ps)

## Health Check Results

\`\`\`json
$(curl -s http://localhost:3000/api/health | jq '.' 2>/dev/null || echo "Health check endpoint not responding")
\`\`\`

## Container Information

$(docker-compose logs --tail=50 app 2>/dev/null | tail -10)

---
Generated by VRBNBXOSS deployment script
EOF
    
    print_status "Deployment report saved to $REPORT_FILE"
    echo ""
}

# Rollback function
rollback() {
    echo -e "${BLUE}⏪ Rolling back deployment...${NC}"
    
    # Find latest backup
    LATEST_BACKUP=$(find backups/ -type d -name "20*" | sort -r | head -n1)
    
    if [[ -z "$LATEST_BACKUP" ]]; then
        print_error "No backup found for rollback"
    fi
    
    echo "Rolling back to backup: $LATEST_BACKUP"
    
    # Stop current services
    docker-compose down
    
    # Restore database
    if [[ -f "$LATEST_BACKUP/database.sql" ]]; then
        docker-compose up -d postgres
        sleep 10
        docker-compose exec -T postgres psql -U postgres -d vrbnbxoss_prod < "$LATEST_BACKUP/database.sql"
        print_status "Database restored"
    fi
    
    # Restore configuration
    if [[ -f "$LATEST_BACKUP/docker-compose.backup.yml" ]]; then
        cp "$LATEST_BACKUP/docker-compose.backup.yml" docker-compose.yml
        print_status "Configuration restored"
    fi
    
    # Start services
    docker-compose up -d
    
    print_status "Rollback completed"
}

# Main deployment function
deploy() {
    case "$DEPLOY_STRATEGY" in
        "rolling")
            deploy_rolling
            ;;
        "blue-green")
            deploy_blue_green
            ;;
        "simple"|*)
            deploy_simple
            ;;
    esac
}

# Main execution flow
main() {
    check_prerequisites
    load_environment
    create_backup
    deploy
    post_deployment_tasks
    generate_report
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo "Application is running at:"
    echo "  • Health Check: http://localhost:3000/api/health"
    echo "  • Metrics: http://localhost:3000/api/health/metrics"
    echo ""
    echo "To monitor logs:"
    echo "  docker-compose logs -f app"
    echo ""
    echo "To check status:"
    echo "  docker-compose ps"
}

# Handle script arguments
case "${1:-}" in
    "rollback")
        rollback
        exit 0
        ;;
    "status")
        docker-compose ps
        echo ""
        curl -s http://localhost:3000/api/health | jq '.' 2>/dev/null || echo "Health check failed"
        exit 0
        ;;
    "logs")
        docker-compose logs -f app
        exit 0
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [rollback|status|logs|help]"
        echo ""
        echo "Options:"
        echo "  (no args)         Deploy with current configuration"
        echo "  rollback          Rollback to previous deployment"
        echo "  status            Show deployment status"
        echo "  logs              Show application logs"
        echo "  help              Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  ENVIRONMENT              Target environment (default: production)"
        echo "  DEPLOY_STRATEGY          rolling|blue-green|simple (default: rolling)"
        echo "  HEALTH_CHECK_TIMEOUT     Health check timeout in seconds (default: 300)"
        echo "  BACKUP_BEFORE_DEPLOY     Create backup before deploy (default: true)"
        exit 0
        ;;
esac

# Run the main function
main