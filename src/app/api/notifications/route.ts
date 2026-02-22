import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - List notifications for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = {
      userId: user.id,
      ...(unreadOnly && { read: false })
    }

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.notification.count({
        where: { userId: user.id, read: false }
      })
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length
    })
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 })
  }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAllRead } = body

    if (markAllRead) {
      // Mark all notifications as read
      await db.notification.updateMany({
        where: {
          userId: user.id,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      })

      // Log audit
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          entityType: 'Notification',
          entityId: 'all',
          details: JSON.stringify({ action: 'mark_all_read' }),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })

      return NextResponse.json({ success: true, message: 'Todas as notificações marcadas como lidas' })
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'IDs de notificação inválidos' }, { status: 400 })
    }

    // Mark specific notifications as read
    const result = await db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: user.id
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    // Log audit for each notification
    for (const notificationId of notificationIds) {
      const notification = await db.notification.findUnique({
        where: { id: notificationId }
      })

      if (notification) {
        await db.auditLog.create({
          data: {
            userId: user.id,
            action: 'READ',
            entityType: 'Notification',
            entityId: notificationId,
            details: JSON.stringify({
              title: notification.title,
              alertId: notification.alertId
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        })

        // If notification is linked to an alert, mark the alert as acknowledged
        if (notification.alertId) {
          await db.documentAlert.update({
            where: { id: notification.alertId },
            data: {
              status: 'acknowledged',
              acknowledgedAt: new Date(),
              acknowledgedBy: user.id
            }
          }).catch(() => {
            // Alert might not exist or already acknowledged
          })
        }
      }
    }

    return NextResponse.json({ success: true, updated: result.count })
  } catch (error) {
    console.error('Erro ao atualizar notificações:', error)
    return NextResponse.json({ error: 'Erro ao atualizar notificações' }, { status: 500 })
  }
}

// DELETE - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 })
    }

    // Verify ownership
    const notification = await db.notification.findFirst({
      where: { id, userId: user.id }
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    await db.notification.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar notificação:', error)
    return NextResponse.json({ error: 'Erro ao deletar notificação' }, { status: 500 })
  }
}
