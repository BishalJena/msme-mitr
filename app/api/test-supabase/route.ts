import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Test API route to verify Supabase server client initialization
 * GET /api/test-supabase
 */
export async function GET() {
  try {
    // Test server client creation
    const supabase = await createClient()
    
    // Test a simple query to verify connection
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Supabase server client initialized but auth check failed',
          error: error.message,
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase server client initialized successfully',
      hasSession: !!data.session,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to initialize Supabase server client',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
