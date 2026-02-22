import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`
    
    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'Sigma DOCs'
    })
  } catch {
    return NextResponse.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        message: 'Database connection failed'
      },
      { status: 503 }
    )
  }
}
