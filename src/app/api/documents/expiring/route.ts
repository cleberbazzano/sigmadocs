import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - Get expiring/expired documents for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const includeExpired = searchParams.get('expired') !== 'false'
    const includeAcknowledged = searchParams.get('acknowledged') === 'true'

    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    // Build where clause based on user role
    const whereClause: any = {
      expirationDate: { not: null },
      status: { notIn: ['CANCELLED', 'ARCHIVED'] }
    }

    // Non-admin users only see their own documents or department documents
    if (user.role !== 'ADMIN') {
      whereClause.OR = [
        { authorId: user.id },
        { department: user.department }
      ]
    }

    // Get documents with expiration date
    const documents = await db.document.findMany({
      where: whereClause,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        category: {
          select: { id: true, name: true }
        },
        alerts: {
          where: {
            ...(includeAcknowledged ? {} : { status: { not: 'acknowledged' } })
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { expirationDate: 'asc' }
    })

    // Filter and categorize documents
    const expired: any[] = []
    const expiring: any[] = []
    const upcoming: any[] = []

    for (const doc of documents) {
      if (!doc.expirationDate) continue

      const expDate = new Date(doc.expirationDate)
      const daysUntilExpiration = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      const documentData = {
        id: doc.id,
        title: doc.title,
        documentNumber: doc.documentNumber,
        expirationDate: doc.expirationDate,
        daysUntilExpiration,
        status: doc.status,
        category: doc.category,
        author: doc.author,
        hasAlert: doc.alerts.length > 0,
        alertStatus: doc.alerts[0]?.status || null,
        alertAcknowledged: doc.alerts.some((a: any) => a.status === 'acknowledged')
      }

      if (daysUntilExpiration < 0) {
        if (includeExpired) {
          expired.push(documentData)
        }
      } else if (daysUntilExpiration <= 7) {
        expiring.push(documentData)
      } else if (daysUntilExpiration <= days) {
        upcoming.push(documentData)
      }
    }

    // Get alert statistics
    const alertStats = await db.documentAlert.aggregate({
      where: {
        ...(user.role === 'ADMIN' ? {} : {
          document: {
            OR: [
              { authorId: user.id },
              { department: user.department }
            ]
          }
        })
      },
      _count: {
        id: true
      }
    })

    const acknowledgedStats = await db.documentAlert.count({
      where: {
        status: 'acknowledged',
        ...(user.role === 'ADMIN' ? {} : {
          document: {
            OR: [
              { authorId: user.id },
              { department: user.department }
            ]
          }
        })
      }
    })

    return NextResponse.json({
      expired,
      expiring,
      upcoming,
      summary: {
        totalExpired: expired.length,
        totalExpiring: expiring.length,
        totalUpcoming: upcoming.length,
        totalAlerts: alertStats._count.id,
        acknowledgedAlerts: acknowledgedStats
      }
    })
  } catch (error) {
    console.error('Erro ao buscar documentos vencendo:', error)
    return NextResponse.json({ error: 'Erro ao buscar documentos' }, { status: 500 })
  }
}
