import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { processExpirationAlerts } from '@/lib/alerts'
import { db } from '@/lib/db'

// POST - Process expiration alerts (manual trigger or cron)
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (admin or cron secret)
    const user = await getCurrentUser()
    const cronSecret = request.headers.get('x-cron-secret')
    const validCronSecret = process.env.CRON_SECRET

    if (!user && cronSecret !== validCronSecret) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Only admin can manually trigger
    if (user && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Process alerts
    const result = await processExpirationAlerts()

    // Log the processing
    if (user) {
      try {
        await db.auditLog.create({
          data: {
            userId: user.id,
            action: 'UPDATE',
            entityType: 'DocumentAlert',
            entityId: 'process',
            details: JSON.stringify(result),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        })
      } catch {
        // Ignore audit log errors
      }
    }

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error processing alerts:', error)
    return NextResponse.json(
      { error: 'Erro ao processar alertas', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// GET - Check if alert processing is working
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Alert processing endpoint is active',
    timestamp: new Date().toISOString()
  })
}
