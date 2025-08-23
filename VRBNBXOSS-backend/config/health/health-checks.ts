// VRBNBXOSS Health Check Implementation
// Comprehensive health monitoring for all services

import { createClient } from '@supabase/supabase-js';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
      details?: any;
    };
  };
}

interface ServiceCheck {
  name: string;
  check: () => Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string; details?: any }>;
}

class HealthCheckService {
  private startTime: number;
  private version: string;

  constructor() {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || '1.0.0';
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthStatus> {
    const checks: ServiceCheck[] = [
      { name: 'supabase', check: this.checkSupabase },
      { name: 'database', check: this.checkDatabase },
      { name: 'redis', check: this.checkRedis },
      { name: 'external_apis', check: this.checkExternalAPIs },
      { name: 'file_system', check: this.checkFileSystem },
      { name: 'memory', check: this.checkMemory },
    ];

    const results: HealthStatus['services'] = {};
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    // Run all checks in parallel
    await Promise.allSettled(
      checks.map(async ({ name, check }) => {
        try {
          const result = await Promise.race([
            check.bind(this)(),
            this.timeoutPromise(5000), // 5 second timeout
          ]);
          results[name] = result;
        } catch (error) {
          results[name] = {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          overallStatus = 'unhealthy';
        }
      })
    );

    // Determine overall status
    const unhealthyServices = Object.values(results).filter(r => r.status === 'unhealthy').length;
    if (unhealthyServices > 0) {
      overallStatus = unhealthyServices > 1 ? 'unhealthy' : 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime: Date.now() - this.startTime,
      services: results,
    };
  }

  /**
   * Basic liveness check (fast)
   */
  async livenessCheck(): Promise<{ status: 'ok' | 'error'; timestamp: string; uptime: number }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Readiness check (dependencies)
   */
  async readinessCheck(): Promise<{ status: 'ready' | 'not_ready'; services: string[] }> {
    const criticalServices = ['supabase', 'database'];
    const results: string[] = [];

    for (const service of criticalServices) {
      try {
        let result;
        switch (service) {
          case 'supabase':
            result = await this.checkSupabase();
            break;
          case 'database':
            result = await this.checkDatabase();
            break;
        }
        if (result.status === 'healthy') {
          results.push(service);
        }
      } catch (error) {
        // Service is not ready
      }
    }

    return {
      status: results.length === criticalServices.length ? 'ready' : 'not_ready',
      services: results,
    };
  }

  /**
   * Check Supabase connection
   */
  private async checkSupabase() {
    const startTime = Date.now();
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Test connection with a simple query
      const { error } = await supabase.from('profiles').select('id').limit(1);
      
      if (error) throw error;

      return {
        status: 'healthy' as const,
        responseTime: Date.now() - startTime,
        details: { url: process.env.NEXT_PUBLIC_SUPABASE_URL },
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check direct database connection
   */
  private async checkDatabase() {
    const startTime = Date.now();
    try {
      // This would be a direct PostgreSQL connection check
      // For now, we'll proxy through Supabase
      return await this.checkSupabase();
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check Redis connection
   */
  private async checkRedis() {
    const startTime = Date.now();
    try {
      // In a real implementation, you'd check Redis connection here
      // For now, return healthy if REDIS_URL is configured
      if (!process.env.REDIS_URL) {
        throw new Error('Redis not configured');
      }

      return {
        status: 'healthy' as const,
        responseTime: Date.now() - startTime,
        details: { url: process.env.REDIS_URL },
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check external API services
   */
  private async checkExternalAPIs() {
    const startTime = Date.now();
    const apis = [
      { name: 'Stripe', url: 'https://api.stripe.com/v1/account', key: process.env.STRIPE_SECRET_KEY },
      { name: 'Resend', configured: !!process.env.RESEND_API_KEY },
      { name: 'Twilio', configured: !!process.env.TWILIO_ACCOUNT_SID },
    ];

    try {
      const results = await Promise.allSettled(
        apis.map(async (api) => {
          if (api.url && api.key) {
            // Test actual API connection (for Stripe example)
            const response = await fetch(api.url, {
              headers: { Authorization: `Bearer ${api.key}` },
            });
            return { name: api.name, status: response.ok };
          }
          return { name: api.name, status: api.configured };
        })
      );

      const allHealthy = results.every(
        (result) => result.status === 'fulfilled' && result.value.status
      );

      return {
        status: allHealthy ? 'healthy' as const : 'unhealthy' as const,
        responseTime: Date.now() - startTime,
        details: results.map((r, i) => ({
          name: apis[i].name,
          status: r.status === 'fulfilled' && r.value.status ? 'ok' : 'error',
        })),
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check file system access
   */
  private async checkFileSystem() {
    const startTime = Date.now();
    try {
      // Check if we can write to temp directory
      const fs = await import('fs/promises');
      const path = await import('path');
      const tempFile = path.join('/tmp', `health-check-${Date.now()}.txt`);
      
      await fs.writeFile(tempFile, 'health check');
      await fs.unlink(tempFile);

      return {
        status: 'healthy' as const,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory() {
    const startTime = Date.now();
    try {
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;
      const memoryUsagePercent = (usedMem / totalMem) * 100;

      const status = memoryUsagePercent < 90 ? 'healthy' : 'unhealthy';

      return {
        status: status as const,
        responseTime: Date.now() - startTime,
        details: {
          heapUsed: Math.round(usedMem / 1024 / 1024),
          heapTotal: Math.round(totalMem / 1024 / 1024),
          usagePercent: Math.round(memoryUsagePercent),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Timeout promise helper
   */
  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Health check timeout after ${ms}ms`)), ms);
    });
  }
}

// Export singleton instance
export const healthCheckService = new HealthCheckService();

// Export types
export type { HealthStatus };