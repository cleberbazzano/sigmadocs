import { db } from '@/lib/db'
import { sendExpirationNotification, sendEscalationNotification } from '@/lib/email/templates'

export interface AlertConfig {
  firstAlertDays: number
  secondAlertDays: number
  thirdAlertDays: number
  finalAlertDays: number
  escalationEnabled: boolean
  escalationDays: number
  maxEscalationLevel: number
  emailEnabled: boolean
}

const DEFAULT_CONFIG: AlertConfig = {
  firstAlertDays: 30,
  secondAlertDays: 15,
  thirdAlertDays: 7,
  finalAlertDays: 1,
  escalationEnabled: true,
  escalationDays: 3,
  maxEscalationLevel: 3,
  emailEnabled: true
}

/**
 * Get alert configuration from database or return defaults
 */
async function getAlertConfig(): Promise<AlertConfig> {
  try {
    const config = await db.alertConfiguration.findFirst()
    if (config) {
      return {
        firstAlertDays: config.firstAlertDays,
        secondAlertDays: config.secondAlertDays,
        thirdAlertDays: config.thirdAlertDays,
        finalAlertDays: config.finalAlertDays,
        escalationEnabled: config.escalationEnabled,
        escalationDays: config.escalationDays,
        maxEscalationLevel: config.maxEscalationLevel,
        emailEnabled: config.emailEnabled
      }
    }
  } catch {
    // Table might not exist yet
  }
  return DEFAULT_CONFIG
}

/**
 * Process all document expiration alerts
 * Should be called periodically (cron job or scheduled task)
 */
export async function processExpirationAlerts(): Promise<{
  processed: number
  alerts: number
  escalations: number
  errors: string[]
}> {
  const result = {
    processed: 0,
    alerts: 0,
    escalations: 0,
    errors: [] as string[]
  }

  try {
    const config = await getAlertConfig()
    const now = new Date()

    // Get all documents with expiration dates
    const documents = await db.document.findMany({
      where: {
        expirationDate: { not: null },
        status: { notIn: ['CANCELLED', 'ARCHIVED'] }
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true, department: true }
        },
        category: {
          select: { id: true, name: true }
        },
        alerts: {
          where: { status: { not: 'acknowledged' } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    result.processed = documents.length

    for (const doc of documents) {
      if (!doc.expirationDate) continue

      const expDate = new Date(doc.expirationDate)
      const daysUntilExpiration = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Determine alert level based on days
      let alertLevel = 0
      if (daysUntilExpiration <= 0) {
        alertLevel = 5 // Expired
      } else if (daysUntilExpiration <= config.finalAlertDays) {
        alertLevel = 4 // Final alert
      } else if (daysUntilExpiration <= config.thirdAlertDays) {
        alertLevel = 3 // Third alert
      } else if (daysUntilExpiration <= config.secondAlertDays) {
        alertLevel = 2 // Second alert
      } else if (daysUntilExpiration <= config.firstAlertDays) {
        alertLevel = 1 // First alert
      }

      if (alertLevel === 0) continue

      // Check if we already sent an alert for this level
      const existingAlert = doc.alerts.find((a: any) => 
        a.level === alertLevel || 
        (alertLevel === 5 && a.status === 'sent')
      )

      if (existingAlert) {
        // Check for escalation (expired documents)
        if (daysUntilExpiration < 0 && config.escalationEnabled) {
          const daysOverdue = Math.abs(daysUntilExpiration)
          const lastAlert = doc.alerts[0]
          
          if (lastAlert && lastAlert.sentAt) {
            const daysSinceAlert = Math.ceil(
              (now.getTime() - new Date(lastAlert.sentAt).getTime()) / (1000 * 60 * 60 * 24)
            )

            // Escalate if enough time has passed
            if (daysSinceAlert >= config.escalationDays) {
              const currentLevel = lastAlert.level || 1
              if (currentLevel < config.maxEscalationLevel) {
                await escalateAlert(doc, lastAlert, currentLevel + 1, config)
                result.escalations++
              }
            }
          }
        }
        continue
      }

      // Create new alert
      try {
        await createAndSendAlert(doc, alertLevel, daysUntilExpiration, config)
        result.alerts++
      } catch (error) {
        result.errors.push(`Document ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Update expired document statuses
    await db.document.updateMany({
      where: {
        expirationDate: { lt: now },
        status: { notIn: ['EXPIRED', 'CANCELLED', 'ARCHIVED'] }
      },
      data: { status: 'EXPIRED' }
    })

  } catch (error) {
    result.errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

/**
 * Create and send alert for a document
 */
async function createAndSendAlert(
  doc: any,
  alertLevel: number,
  daysUntilExpiration: number,
  config: AlertConfig
): Promise<void> {
  const now = new Date()

  // Create alert record
  const alert = await db.documentAlert.create({
    data: {
      documentId: doc.id,
      alertDays: daysUntilExpiration,
      alertDate: now,
      status: 'sent',
      level: alertLevel,
      sentAt: now
    }
  })

  // Create notification for document author
  const notification = await db.notification.create({
    data: {
      userId: doc.author.id,
      title: daysUntilExpiration < 0 
        ? `🚨 Documento Vencido: ${doc.title}` 
        : `⚠️ Documento Próximo do Vencimento: ${doc.title}`,
      message: daysUntilExpiration < 0
        ? `O documento venceu há ${Math.abs(daysUntilExpiration)} dia(s)`
        : `O documento vence em ${daysUntilExpiration} dia(s)`,
      type: daysUntilExpiration < 0 ? 'error' : 'warning',
      link: `/documents/${doc.id}`,
      alertId: alert.id,
      metadata: JSON.stringify({
        documentId: doc.id,
        expirationDate: doc.expirationDate,
        daysUntilExpiration,
        alertLevel
      })
    }
  })

  // Create alert notification record
  await db.documentAlertNotification.create({
    data: {
      alertId: alert.id,
      userId: doc.author.id,
      sentAt: now
    }
  })

  // Send email if enabled
  if (config.emailEnabled && doc.author.email) {
    try {
      await sendExpirationNotification(
        {
          documentId: doc.id,
          documentTitle: doc.title,
          documentNumber: doc.documentNumber,
          expirationDate: new Date(doc.expirationDate),
          daysUntilExpiration,
          category: doc.category?.name,
          authorName: doc.author.name,
          authorEmail: doc.author.email
        },
        doc.author.email,
        doc.author.name
      )

      // Update notification as email sent
      await db.documentAlertNotification.updateMany({
        where: { alertId: alert.id, userId: doc.author.id },
        data: { emailSent: true, emailSentAt: now }
      })
    } catch (error) {
      console.error('Error sending email notification:', error)
    }
  }
}

/**
 * Escalate alert to higher level user
 */
async function escalateAlert(
  doc: any,
  lastAlert: any,
  newLevel: number,
  config: AlertConfig
): Promise<void> {
  const now = new Date()
  const daysOverdue = Math.ceil(
    (now.getTime() - new Date(doc.expirationDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Determine who to escalate to
  let escalateToUser = null

  if (newLevel === 2) {
    // Escalate to manager of the same department
    escalateToUser = await db.user.findFirst({
      where: {
        role: 'MANAGER',
        department: doc.author.department,
        active: true
      }
    })
  } else if (newLevel >= 3) {
    // Escalate to admin
    escalateToUser = await db.user.findFirst({
      where: { role: 'ADMIN', active: true }
    })
  }

  if (!escalateToUser) {
    // No one to escalate to, use admin as fallback
    escalateToUser = await db.user.findFirst({
      where: { role: 'ADMIN', active: true }
    })
  }

  if (!escalateToUser) {
    console.warn('No user to escalate to for document:', doc.id)
    return
  }

  // Update alert
  await db.documentAlert.update({
    where: { id: lastAlert.id },
    data: {
      level: newLevel,
      status: 'escalated',
      escalatedAt: now,
      escalatedTo: escalateToUser.id
    }
  })

  // Create notification for escalated user
  await db.notification.create({
    data: {
      userId: escalateToUser.id,
      title: `🚨 ESCALAÇÃO: Documento ${doc.title}`,
      message: `O responsável ${doc.author.name} não tratou o documento vencido há ${daysOverdue} dia(s)`,
      type: 'error',
      link: `/documents/${doc.id}`,
      alertId: lastAlert.id,
      metadata: JSON.stringify({
        documentId: doc.id,
        expirationDate: doc.expirationDate,
        daysOverdue,
        escalatedFrom: doc.author.id,
        escalationLevel: newLevel
      })
    }
  })

  // Create alert notification for escalation
  await db.documentAlertNotification.create({
    data: {
      alertId: lastAlert.id,
      userId: escalateToUser.id,
      sentAt: now
    }
  })

  // Send escalation email
  if (config.emailEnabled && escalateToUser.email) {
    try {
      await sendEscalationNotification(
        {
          documentId: doc.id,
          documentTitle: doc.title,
          documentNumber: doc.documentNumber,
          expirationDate: new Date(doc.expirationDate),
          daysUntilExpiration: -daysOverdue,
          category: doc.category?.name,
          authorName: doc.author.name,
          authorEmail: doc.author.email,
          originalUserName: doc.author.name,
          originalUserEmail: doc.author.email,
          daysOverdue
        },
        escalateToUser.email,
        escalateToUser.name
      )

      await db.documentAlertNotification.updateMany({
        where: { alertId: lastAlert.id, userId: escalateToUser.id },
        data: { emailSent: true, emailSentAt: now }
      })
    } catch (error) {
      console.error('Error sending escalation email:', error)
    }
  }

  // Log audit
  await db.auditLog.create({
    data: {
      action: 'UPDATE',
      entityType: 'DocumentAlert',
      entityId: lastAlert.id,
      details: JSON.stringify({
        action: 'escalation',
        level: newLevel,
        escalatedTo: escalateToUser.id,
        daysOverdue
      })
    }
  })
}

/**
 * Create initial alert for a document when created/updated with expiration date
 */
export async function createInitialAlert(documentId: string): Promise<void> {
  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: {
      author: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true } }
    }
  })

  if (!doc || !doc.expirationDate) return

  const config = await getAlertConfig()
  const now = new Date()
  const expDate = new Date(doc.expirationDate)
  const daysUntilExpiration = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Only create alert if within alert window
  if (daysUntilExpiration <= config.firstAlertDays) {
    let alertLevel = 1
    if (daysUntilExpiration <= 0) alertLevel = 5
    else if (daysUntilExpiration <= config.finalAlertDays) alertLevel = 4
    else if (daysUntilExpiration <= config.thirdAlertDays) alertLevel = 3
    else if (daysUntilExpiration <= config.secondAlertDays) alertLevel = 2

    await createAndSendAlert(doc, alertLevel, daysUntilExpiration, config)
  }
}
