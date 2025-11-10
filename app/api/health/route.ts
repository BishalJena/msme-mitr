import { NextRequest, NextResponse } from 'next/server';
import { openRouterService } from '@/services/ai/openRouterService';
import { schemeDataService } from '@/services/schemes/schemeDataService';

/**
 * Health Check Endpoint
 * Returns the status of various services
 */
export async function GET(request: NextRequest) {
  try {
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        schemeData: {
          status: 'operational',
          schemesCount: schemeDataService.getAllSchemes().length
        },
        openRouter: {
          status: openRouterService.isConfigured() ? 'configured' : 'not_configured',
          apiKeyPresent: !!process.env.OPENROUTER_API_KEY
        }
      }
    };

    return NextResponse.json(status, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'ok'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal service error'
      },
      { status: 503 }
    );
  }
}