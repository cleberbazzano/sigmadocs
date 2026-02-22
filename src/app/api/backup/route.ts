import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createBackup, listBackups, getBackupStats, cleanupOldBackups } from '@/lib/backup/service'

// GET - List backups
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const stats = searchParams.get('stats') === 'true'

    if (stats) {
      const backupStats = await getBackupStats()
      return NextResponse.json(backupStats)
    }

    const limit = parseInt(searchParams.get('limit') || '20')
    const backups = await listBackups(limit)

    return NextResponse.json({ backups })
  } catch (error) {
    console.error('Error fetching backups:', error)
    return NextResponse.json({ error: 'Erro ao buscar backups' }, { status: 500 })
  }
}

// POST - Create backup
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const type = body.type || 'full'

    const result = await createBackup({
      type,
      createdBy: user.id
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'Backup',
        entityId: result.backupId,
        details: JSON.stringify({ type, filename: result.filename }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      backup: {
        id: result.backupId,
        filename: result.filename,
        fileSize: result.fileSize
      }
    })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json({ error: 'Erro ao criar backup' }, { status: 500 })
  }
}

// DELETE - Cleanup old backups
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const keepCount = parseInt(searchParams.get('keep') || '10')

    const deleted = await cleanupOldBackups(keepCount)

    return NextResponse.json({
      success: true,
      deleted,
      message: `${deleted} backups antigos removidos`
    })
  } catch (error) {
    console.error('Error cleaning up backups:', error)
    return NextResponse.json({ error: 'Erro ao limpar backups' }, { status: 500 })
  }
}
