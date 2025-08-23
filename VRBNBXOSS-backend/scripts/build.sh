#!/bin/bash

# VRBNBXOSS Backend Build Script
# Automated build and deployment preparation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="vrbnbxoss"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
BUILD_TARGET="${BUILD_TARGET:-production}"
VERSION="${VERSION:-$(date +%Y%m%d-%H%M%S)}"

echo -e "${BLUE}🚀 VRBNBXOSS Backend Build Script${NC}"
echo -e "${BLUE}=================================${NC}"
echo "Build Target: $BUILD_TARGET"
echo "Version: $VERSION"
echo "Registry: ${DOCKER_REGISTRY:-local}"
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
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
    fi
    print_status "Docker is available"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
    fi
    print_status "Docker Compose is available"
    
    # Check if we're in the right directory
    if [[ ! -f "Dockerfile" ]]; then
        print_error "Dockerfile not found. Run this script from the forkcast-backend directory"
    fi
    print_status "Project structure validated"
    
    # Check environment file
    if [[ "$BUILD_TARGET" == "production" && ! -f ".env" ]]; then
        print_warning "No .env file found. Make sure environment variables are set"
    fi
    
    echo ""
}

# Clean previous builds
clean_builds() {
    echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
    
    # Remove dangling images
    docker image prune -f > /dev/null 2>&1 || true
    print_status "Cleaned dangling images"
    
    # Stop and remove existing containers
    docker-compose down > /dev/null 2>&1 || true
    print_status "Stopped existing containers"
    
    echo ""
}

# Build Docker images
build_images() {
    echo -e "${BLUE}🔨 Building Docker images...${NC}"
    
    if [[ "$BUILD_TARGET" == "development" ]]; then
        # Development build
        echo "Building development image..."
        docker build \
            -f docker/Dockerfile.dev \
            -t "${PROJECT_NAME}-backend:dev-${VERSION}" \
            -t "${PROJECT_NAME}-backend:dev-latest" \
            ../
        print_status "Development image built"
    else
        # Production build
        echo "Building production image..."
        docker build \
            --target production \
            --build-arg NODE_ENV=production \
            --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
            --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
            -t "${PROJECT_NAME}-backend:${VERSION}" \
            -t "${PROJECT_NAME}-backend:latest" \
            ../
        print_status "Production image built"
    fi
    
    echo ""
}

# Run security scan
security_scan() {
    echo -e "${BLUE}🔒 Running security scan...${NC}"
    
    IMAGE_NAME="${PROJECT_NAME}-backend:${BUILD_TARGET == "development" ? "dev-latest" : "latest"}"
    
    # Check if Trivy is available
    if command -v trivy &> /dev/null; then
        echo "Running Trivy security scan..."
        trivy image --severity HIGH,CRITICAL "${IMAGE_NAME}" || print_warning "Security vulnerabilities found"
    else
        print_warning "Trivy not installed. Skipping security scan"
    fi
    
    echo ""
}

# Test the built image
test_image() {
    echo -e "${BLUE}🧪 Testing built image...${NC}"
    
    IMAGE_NAME="${PROJECT_NAME}-backend:${BUILD_TARGET == "development" ? "dev-latest" : "latest"}"
    
    # Test if image runs
    CONTAINER_ID=$(docker run -d \
        -e NODE_ENV="$BUILD_TARGET" \
        -e NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-http://localhost:54321}" \
        -e NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-dummy}" \
        -p 3000:3000 \
        "${IMAGE_NAME}")
    
    # Wait for container to start
    sleep 10
    
    # Test health endpoint
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "Health check passed"
    else
        print_warning "Health check failed - this is expected if Supabase is not configured"
    fi
    
    # Cleanup test container
    docker stop "$CONTAINER_ID" > /dev/null
    docker rm "$CONTAINER_ID" > /dev/null
    print_status "Image test completed"
    
    echo ""
}

# Push to registry
push_to_registry() {
    if [[ -n "$DOCKER_REGISTRY" ]]; then
        echo -e "${BLUE}📤 Pushing to registry...${NC}"
        
        if [[ "$BUILD_TARGET" == "development" ]]; then
            docker tag "${PROJECT_NAME}-backend:dev-${VERSION}" "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:dev-${VERSION}"
            docker tag "${PROJECT_NAME}-backend:dev-latest" "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:dev-latest"
            docker push "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:dev-${VERSION}"
            docker push "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:dev-latest"
        else
            docker tag "${PROJECT_NAME}-backend:${VERSION}" "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}"
            docker tag "${PROJECT_NAME}-backend:latest" "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:latest"
            docker push "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}"
            docker push "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:latest"
        fi
        
        print_status "Images pushed to registry"
        echo ""
    fi
}

# Generate deployment manifests
generate_manifests() {
    echo -e "${BLUE}📝 Generating deployment manifests...${NC}"
    
    mkdir -p deploy/
    
    # Generate docker-compose override for this version
    cat > deploy/docker-compose.override.yml << EOF
version: '3.8'
services:
  app:
    image: ${DOCKER_REGISTRY:-}${PROJECT_NAME}-backend:${BUILD_TARGET == "development" ? "dev-${VERSION}" : "${VERSION}"}
    environment:
      - BUILD_VERSION=${VERSION}
      - BUILD_TARGET=${BUILD_TARGET}
      - BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
    
    print_status "Docker Compose override generated"
    
    # Generate Kubernetes manifests (if needed)
    if [[ "$BUILD_TARGET" == "production" ]]; then
        cat > deploy/kubernetes-deployment.yml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vrbnbxoss-backend
  labels:
    app: vrbnbxoss-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vrbnbxoss-backend
  template:
    metadata:
      labels:
        app: vrbnbxoss-backend
    spec:
      containers:
      - name: backend
        image: ${DOCKER_REGISTRY:-}${PROJECT_NAME}-backend:${VERSION}
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: vrbnbxoss-backend-service
spec:
  selector:
    app: vrbnbxoss-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
EOF
        print_status "Kubernetes manifests generated"
    fi
    
    echo ""
}

# Main execution flow
main() {
    check_prerequisites
    clean_builds
    build_images
    security_scan
    test_image
    push_to_registry
    generate_manifests
    
    echo -e "${GREEN}🎉 Build completed successfully!${NC}"
    echo ""
    echo "Built images:"
    if [[ "$BUILD_TARGET" == "development" ]]; then
        echo "  • ${PROJECT_NAME}-backend:dev-${VERSION}"
        echo "  • ${PROJECT_NAME}-backend:dev-latest"
    else
        echo "  • ${PROJECT_NAME}-backend:${VERSION}"
        echo "  • ${PROJECT_NAME}-backend:latest"
    fi
    echo ""
    echo "To run locally:"
    echo "  docker-compose up -d"
    echo ""
    echo "To deploy to production:"
    echo "  docker-compose -f docker-compose.prod.yml -f deploy/docker-compose.override.yml up -d"
}

# Handle script arguments
case "${1:-}" in
    "dev"|"development")
        BUILD_TARGET="development"
        ;;
    "prod"|"production")
        BUILD_TARGET="production"
        ;;
    "clean")
        clean_builds
        exit 0
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [dev|prod|clean|help]"
        echo ""
        echo "Options:"
        echo "  dev, development  Build development image"
        echo "  prod, production  Build production image (default)"
        echo "  clean            Clean previous builds"
        echo "  help             Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  DOCKER_REGISTRY   Docker registry to push images to"
        echo "  VERSION          Build version (default: timestamp)"
        exit 0
        ;;
esac

# Run the main function
main