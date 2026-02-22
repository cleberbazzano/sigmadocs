import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { acquireDocumentLock, releaseDocumentLock, getDocumentLockInfo } from '@/lib/collaboration/lock'

// GET - Get lock info for a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await params
    const lockInfo = await getDocumentLockInfo(id)

    // Get user details if locked
    if (lockInfo.isLocked && lockInfo.lockedBy) {
      const lockedUser = await db.user.findUnique({
        where: { id: lockInfo.lockedBy.id },
        select: { id: true, name: true, email: true }
      })
      if (lockedUser) {
        lockInfo.lockedBy = lockedUser
      }
    }

    return NextResponse.json(lockInfo)
  } catch (error) {
    console.error('Error getting lock info:', error)
    return NextResponse.json({ error: 'Erro ao verificar bloqueio' }, { status: 500 })
  }
}

// POST - Acquire lock
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await params
    const result = await acquireDocumentLock(id, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'DocumentLock',
        entityId: id,
        details: JSON.stringify({ action: 'acquire_lock' }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ success: true, lockId: result.lockId })
  } catch (error) {
    console.error('Error acquiring lock:', error)
    return NextResponse.json({ error: 'Erro ao bloquear documento' }, { status: 500 })
  }
}

// DELETE - Release lock
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await params
    const result = await releaseDocumentLock(id, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 })
    }

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'DocumentLock',
        entityId: id,
        details: JSON.stringify({ action: 'release_lock' }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error releasing lock:', error)
    return NextResponse.json({ error: 'Erro ao liberar documento' }, { status: 500 })
  }
}
