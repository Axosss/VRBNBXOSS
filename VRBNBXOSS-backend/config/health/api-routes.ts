// VRBNBXOSS Health Check API Routes
// To be placed in app/api/health/ directory

import { NextRequest, NextResponse } from 'next/server';
import { healthCheckService } from './health-checks';

/**
 * Main health check endpoint
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  try {
    const healthStatus = await healthCheckService.performHealthCheck();
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * Liveness probe endpoint (Kubernetes)
 * GET /api/health/live
 */
export async function livenessProbe(request: NextRequest) {
  try {
    const result = await healthCheckService.livenessCheck();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * Readiness probe endpoint (Kubernetes)
 * GET /api/health/ready
 */
export async function readinessProbe(request: NextRequest) {
  try {
    const result = await healthCheckService.readinessCheck();
    const statusCode = result.status === 'ready' ? 200 : 503;
    
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * Detailed health metrics endpoint (for monitoring systems)
 * GET /api/health/metrics
 */
export async function healthMetrics(request: NextRequest) {
  try {
    const healthStatus = await healthCheckService.performHealthCheck();
    
    // Convert to Prometheus-style metrics
    const metrics = [
      `# HELP vrbnbxoss_health_status Overall application health status`,
      `# TYPE vrbnbxoss_health_status gauge`,
      `vrbnbxoss_health_status{status="${healthStatus.status}"} ${healthStatus.status === 'healthy' ? 1 : 0}`,
      '',
      `# HELP vrbnbxoss_uptime_seconds Application uptime in seconds`,
      `# TYPE vrbnbxoss_uptime_seconds counter`,
      `vrbnbxoss_uptime_seconds ${Math.floor(healthStatus.uptime / 1000)}`,
      '',
    ];

    // Add service-specific metrics
    Object.entries(healthStatus.services).forEach(([service, status]) => {
      metrics.push(`# HELP vrbnbxoss_service_${service}_status Service health status`);
      metrics.push(`# TYPE vrbnbxoss_service_${service}_status gauge`);
      metrics.push(`vrbnbxoss_service_${service}_status{service="${service}"} ${status.status === 'healthy' ? 1 : 0}`);
      
      if (status.responseTime) {
        metrics.push(`# HELP vrbnbxoss_service_${service}_response_time_ms Service response time`);
        metrics.push(`# TYPE vrbnbxoss_service_${service}_response_time_ms histogram`);
        metrics.push(`vrbnbxoss_service_${service}_response_time_ms{service="${service}"} ${status.responseTime}`);
      }
      metrics.push('');
    });

    return new NextResponse(metrics.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    return new NextResponse(
      `# ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 503, headers: { 'Content-Type': 'text/plain' } }
    );
  }
}

// Export individual functions for use in app/api/health/[...slug]/route.ts
export { GET as default, livenessProbe, readinessProbe, healthMetrics };