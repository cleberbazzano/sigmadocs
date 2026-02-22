import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { restoreBackup } from '@/lib/backup/service'

// POST - Restore backup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id } = await params
    const result = await restoreBackup(id, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Log audit (this will go to the restored database)
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'RESTORE',
        entityType: 'Backup',
        entityId: id,
        details: JSON.stringify({ action: 'restore' }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Backup restaurado com sucesso'
    })
  } catch (error) {
    console.error('Error restoring backup:', error)
    return NextResponse.json({ error: 'Erro ao restaurar backup' }, { status: 500 })
  }
}
