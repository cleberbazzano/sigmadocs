import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Get document statistics
    const [
      totalDocuments,
      signedDocuments,
      pendingDocuments,
      expiringDocuments,
      archivedDocuments
    ] = await Promise.all([
      db.document.count(),
      db.document.count({ where: { status: 'SIGNED' } }),
      db.document.count({ where: { status: 'PENDING' } }),
      db.document.count({
        where: {
          expirationDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: new Date()
          },
          status: { notIn: ['ARCHIVED', 'CANCELLED'] }
        }
      }),
      db.document.count({ where: { status: 'ARCHIVED' } })
    ])

    // Get backup statistics
    const backupCount = await db.backupRecord.count()
    const latestBackup = await db.backupRecord.findFirst({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true, fileSize: true }
    })
    const backupSizeAggregate = await db.backupRecord.aggregate({
      _sum: { fileSize: true },
      where: { status: 'completed' }
    })

    // Get task statistics
    const taskCount = await db.scheduledTask.count()
    const activeTaskCount = await db.scheduledTask.count({ where: { enabled: true } })
    const nextTask = await db.scheduledTask.findFirst({
      where: { enabled: true, nextRunAt: { gte: new Date() } },
      orderBy: { nextRunAt: 'asc' },
      select: { nextRunAt: true }
    })

    // Get API key statistics (admin only)
    let apiKeyCount = 0
    let activeApiKeyCount = 0
    if (user.role === 'ADMIN') {
      apiKeyCount = await db.apiKey.count()
      activeApiKeyCount = await db.apiKey.count({ where: { active: true } })
    }

    // Get workflow statistics
    const workflowCount = await db.approvalWorkflow.count()
    const activeWorkflowCount = await db.approvalWorkflow.count({ where: { status: 'ACTIVE' } })
    const completedWorkflowCount = await db.approvalWorkflow.count({ where: { status: 'COMPLETED' } })

    // Get comment statistics
    const commentCount = await db.documentComment.count()
    const unresolvedCommentCount = await db.documentComment.count({ where: { resolved: false } })

    // Get recent documents
    const recentDocuments = await db.document.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        author: { select: { name: true } },
        type: { select: { name: true } }
      }
    })

    // Get expiring documents
    const expiringDocs = await db.document.findMany({
      where: {
        expirationDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gte: new Date()
        },
        status: { notIn: ['ARCHIVED', 'CANCELLED'] }
      },
      take: 5,
      orderBy: { expirationDate: 'asc' },
      select: {
        id: true,
        title: true,
        expirationDate: true
      }
    })

    // Calculate storage (approximate based on file sizes in DB)
    const storageStats = await db.document.aggregate({
      _sum: { fileSize: true }
    })
    const usedStorage = storageStats._sum.fileSize || 0

    // Calculate days remaining for expiring documents
    const expiringWithDays = expiringDocs.map(doc => ({
      ...doc,
      daysRemaining: Math.ceil((new Date(doc.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }))

    return NextResponse.json({
      documents: {
        total: totalDocuments,
        signed: signedDocuments,
        pending: pendingDocuments,
        expiring: expiringDocuments,
        archived: archivedDocuments
      },
      storage: {
        used: usedStorage,
        total: 100 * 1024 * 1024 * 1024, // 100 GB default
        byType: []
      },
      backups: {
        total: backupCount,
        latestDate: latestBackup?.completedAt || null,
        totalSize: backupSizeAggregate._sum.fileSize || 0
      },
      tasks: {
        total: taskCount,
        active: activeTaskCount,
        nextRun: nextTask?.nextRunAt || null
      },
      apiKeys: {
        total: apiKeyCount,
        active: activeApiKeyCount
      },
      workflows: {
        total: workflowCount,
        active: activeWorkflowCount,
        completed: completedWorkflowCount
      },
      comments: {
        total: commentCount,
        unresolved: unresolvedCommentCount
      },
      recentDocuments: recentDocuments.map(d => ({
        id: d.id,
        title: d.title,
        status: d.status,
        createdAt: d.createdAt,
        authorName: d.author?.name,
        typeName: d.type?.name
      })),
      expiringDocuments: expiringWithDays
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
