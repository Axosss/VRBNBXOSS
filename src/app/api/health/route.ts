import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    const supabase = await createClient()
    
    // Test database connection
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (dbError) {
      throw new Error(`Database connection failed: ${dbError.message}`)
    }
    
    const responseTime = Date.now() - startTime
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: 'healthy',
          responseTime: responseTime,
        },
        supabase: {
          status: 'healthy',
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'not configured',
        },
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
    }
    
    return NextResponse.json(createSuccessResponse(healthData))
    
  } catch (error) {
    const errorResponse = createErrorResponse(error, 'Health check failed')
    return NextResponse.json(
      {
        ...errorResponse,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}