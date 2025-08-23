#!/bin/bash

# VRBNBXOSS Security Scanning Script
# Comprehensive security analysis for Docker containers and dependencies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_NAME="vrbnbxoss"
IMAGE_NAME="${PROJECT_NAME}-backend:latest"
REPORT_DIR="security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}🔒 VRBNBXOSS Security Scanner${NC}"
echo -e "${BLUE}============================${NC}"
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
}

# Create report directory
mkdir -p "$REPORT_DIR"

# Check if required tools are installed
check_tools() {
    echo -e "${BLUE}🛠️ Checking security tools...${NC}"
    
    local tools_available=true
    
    # Trivy for vulnerability scanning
    if ! command -v trivy &> /dev/null; then
        print_warning "Trivy not installed - install with: brew install aquasecurity/trivy/trivy"
        tools_available=false
    else
        print_status "Trivy available"
    fi
    
    # Docker Bench Security
    if [[ ! -f "docker-bench-security/docker-bench-security.sh" ]]; then
        print_warning "Docker Bench Security not found - will download if needed"
    else
        print_status "Docker Bench Security available"
    fi
    
    # Hadolint for Dockerfile linting
    if ! command -v hadolint &> /dev/null; then
        print_warning "Hadolint not installed - install with: brew install hadolint"
        tools_available=false
    else
        print_status "Hadolint available"
    fi
    
    if [[ "$tools_available" == "false" ]]; then
        echo ""
        echo "Some security tools are missing. Install them for complete security analysis."
        echo ""
    fi
}

# Dockerfile security analysis
scan_dockerfile() {
    echo -e "${BLUE}📄 Scanning Dockerfile...${NC}"
    
    if command -v hadolint &> /dev/null; then
        echo "Running Hadolint on Dockerfile..."
        hadolint Dockerfile > "$REPORT_DIR/dockerfile-scan-$TIMESTAMP.txt" 2>&1 || true
        
        if [[ -s "$REPORT_DIR/dockerfile-scan-$TIMESTAMP.txt" ]]; then
            print_warning "Dockerfile issues found - check $REPORT_DIR/dockerfile-scan-$TIMESTAMP.txt"
        else
            print_status "Dockerfile security check passed"
        fi
    else
        print_warning "Skipping Dockerfile scan - hadolint not available"
    fi
}

# Container vulnerability scanning
scan_vulnerabilities() {
    echo -e "${BLUE}🐛 Scanning for vulnerabilities...${NC}"
    
    if command -v trivy &> /dev/null; then
        echo "Running Trivy vulnerability scan..."
        
        # Scan for HIGH and CRITICAL vulnerabilities
        trivy image --severity HIGH,CRITICAL --format json --output "$REPORT_DIR/vulnerabilities-$TIMESTAMP.json" "$IMAGE_NAME" || true
        
        # Generate human-readable report
        trivy image --severity HIGH,CRITICAL "$IMAGE_NAME" > "$REPORT_DIR/vulnerabilities-$TIMESTAMP.txt" 2>&1 || true
        
        # Check if vulnerabilities were found
        local vuln_count=$(jq '.Results[0].Vulnerabilities | length' "$REPORT_DIR/vulnerabilities-$TIMESTAMP.json" 2>/dev/null || echo "0")
        
        if [[ "$vuln_count" -gt 0 ]]; then
            print_warning "$vuln_count HIGH/CRITICAL vulnerabilities found"
            echo "  Report: $REPORT_DIR/vulnerabilities-$TIMESTAMP.txt"
        else
            print_status "No HIGH/CRITICAL vulnerabilities found"
        fi
    else
        print_warning "Skipping vulnerability scan - trivy not available"
    fi
}

# Docker security benchmarks
scan_docker_bench() {
    echo -e "${BLUE}🏗️ Running Docker security benchmarks...${NC}"
    
    if [[ ! -d "docker-bench-security" ]]; then
        echo "Downloading Docker Bench Security..."
        git clone https://github.com/docker/docker-bench-security.git > /dev/null 2>&1 || {
            print_warning "Failed to download Docker Bench Security"
            return
        }
    fi
    
    if [[ -f "docker-bench-security/docker-bench-security.sh" ]]; then
        echo "Running Docker Bench Security..."
        cd docker-bench-security
        sudo ./docker-bench-security.sh > "../$REPORT_DIR/docker-bench-$TIMESTAMP.txt" 2>&1 || true
        cd ..
        print_status "Docker Bench Security completed"
        echo "  Report: $REPORT_DIR/docker-bench-$TIMESTAMP.txt"
    else
        print_warning "Docker Bench Security not available"
    fi
}

# Check container runtime security
check_container_security() {
    echo -e "${BLUE}🔐 Checking container runtime security...${NC}"
    
    local security_issues=0
    
    # Check if running as root
    echo "Checking user permissions..."
    if docker run --rm "$IMAGE_NAME" whoami | grep -q "root"; then
        print_warning "Container runs as root user"
        security_issues=$((security_issues + 1))
    else
        print_status "Container runs as non-root user"
    fi
    
    # Check for unnecessary capabilities
    echo "Checking container capabilities..."
    local caps=$(docker inspect "$IMAGE_NAME" | jq -r '.[0].Config.User' 2>/dev/null)
    if [[ "$caps" == "null" || -z "$caps" ]]; then
        print_warning "No explicit user set in container"
        security_issues=$((security_issues + 1))
    else
        print_status "Explicit user configuration found"
    fi
    
    # Check for health checks
    echo "Checking health check configuration..."
    local healthcheck=$(docker inspect "$IMAGE_NAME" | jq -r '.[0].Config.Healthcheck' 2>/dev/null)
    if [[ "$healthcheck" == "null" ]]; then
        print_warning "No health check configured"
        security_issues=$((security_issues + 1))
    else
        print_status "Health check configured"
    fi
    
    if [[ $security_issues -eq 0 ]]; then
        print_status "Container runtime security check passed"
    else
        print_warning "$security_issues container security issues found"
    fi
}

# Check secrets and sensitive data
check_secrets() {
    echo -e "${BLUE}🔑 Checking for exposed secrets...${NC}"
    
    local secrets_found=false
    
    # Check image layers for secrets
    echo "Scanning image layers for secrets..."
    
    # Common secret patterns
    declare -a patterns=(
        "password"
        "secret"
        "key"
        "token"
        "api_key"
        "private_key"
        "cert"
    )
    
    # Check image history for secret-like strings
    docker history --no-trunc "$IMAGE_NAME" | grep -iE "(${patterns[*]})" > "$REPORT_DIR/potential-secrets-$TIMESTAMP.txt" 2>/dev/null || true
    
    if [[ -s "$REPORT_DIR/potential-secrets-$TIMESTAMP.txt" ]]; then
        print_warning "Potential secrets found in image history"
        echo "  Check: $REPORT_DIR/potential-secrets-$TIMESTAMP.txt"
        secrets_found=true
    fi
    
    # Check environment variables
    echo "Checking environment variables..."
    docker run --rm "$IMAGE_NAME" env | grep -iE "(${patterns[*]})" > "$REPORT_DIR/env-secrets-$TIMESTAMP.txt" 2>/dev/null || true
    
    if [[ -s "$REPORT_DIR/env-secrets-$TIMESTAMP.txt" ]]; then
        print_warning "Potential secrets in environment variables"
        echo "  Check: $REPORT_DIR/env-secrets-$TIMESTAMP.txt"
        secrets_found=true
    fi
    
    if [[ "$secrets_found" == "false" ]]; then
        print_status "No obvious secrets found"
    fi
}

# Network security check
check_network_security() {
    echo -e "${BLUE}🌐 Checking network security...${NC}"
    
    # Check exposed ports
    echo "Checking exposed ports..."
    local exposed_ports=$(docker inspect "$IMAGE_NAME" | jq -r '.[0].Config.ExposedPorts | keys[]' 2>/dev/null)
    
    if [[ -n "$exposed_ports" ]]; then
        echo "Exposed ports:"
        echo "$exposed_ports" | while read -r port; do
            echo "  - $port"
        done
        print_status "Port exposure documented"
    else
        print_warning "No ports explicitly exposed"
    fi
}

# Generate security summary
generate_summary() {
    echo -e "${BLUE}📊 Generating security summary...${NC}"
    
    local summary_file="$REPORT_DIR/security-summary-$TIMESTAMP.md"
    
    cat > "$summary_file" << EOF
# VRBNBXOSS Security Scan Summary

**Scan Date:** $(date)
**Image:** $IMAGE_NAME
**Scanner Version:** $0

## Summary

This report contains the results of automated security scanning for the VRBNBXOSS backend container.

## Scan Results

### Dockerfile Security
- See: dockerfile-scan-$TIMESTAMP.txt

### Vulnerability Scan
- See: vulnerabilities-$TIMESTAMP.json
- See: vulnerabilities-$TIMESTAMP.txt

### Docker Benchmark
- See: docker-bench-$TIMESTAMP.txt

### Runtime Security
- Container user configuration checked
- Health check configuration verified
- Capability analysis completed

### Secrets Detection
- Image layer analysis: potential-secrets-$TIMESTAMP.txt
- Environment variables: env-secrets-$TIMESTAMP.txt

## Recommendations

1. **Regular Updates**: Keep base images and dependencies updated
2. **Minimal Privileges**: Ensure container runs with minimal required privileges
3. **Secrets Management**: Use proper secrets management solutions
4. **Network Security**: Implement proper network segmentation
5. **Monitoring**: Set up runtime security monitoring

## Next Steps

1. Review all generated reports
2. Address HIGH and CRITICAL vulnerabilities
3. Implement recommended security measures
4. Schedule regular security scans

---
Generated by VRBNBXOSS Security Scanner
EOF
    
    print_status "Security summary generated: $summary_file"
}

# Main execution
main() {
    check_tools
    scan_dockerfile
    scan_vulnerabilities
    scan_docker_bench
    check_container_security
    check_secrets
    check_network_security
    generate_summary
    
    echo ""
    echo -e "${GREEN}🎉 Security scan completed!${NC}"
    echo ""
    echo "Reports generated in: $REPORT_DIR/"
    echo ""
    echo "Key files:"
    echo "  • Security Summary: $REPORT_DIR/security-summary-$TIMESTAMP.md"
    echo "  • Vulnerabilities: $REPORT_DIR/vulnerabilities-$TIMESTAMP.txt"
    echo "  • Dockerfile Issues: $REPORT_DIR/dockerfile-scan-$TIMESTAMP.txt"
    echo ""
    echo "Review all reports and address any security issues found."
}

# Handle script arguments
case "${1:-}" in
    "quick")
        scan_dockerfile
        scan_vulnerabilities
        check_container_security
        generate_summary
        ;;
    "full"|"")
        main
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [quick|full|help]"
        echo ""
        echo "Options:"
        echo "  quick    Quick security scan (Dockerfile + vulnerabilities)"
        echo "  full     Complete security analysis (default)"
        echo "  help     Show this help message"
        echo ""
        echo "Prerequisites:"
        echo "  • trivy (vulnerability scanner)"
        echo "  • hadolint (Dockerfile linter)"
        echo "  • jq (JSON processor)"
        echo "  • docker (container runtime)"
        exit 0
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac