import { db } from '@/lib/db'
import { processExpirationAlerts } from '@/lib/alerts'
import { createBackup, cleanupOldBackups } from '@/lib/backup/service'
import { cleanupExpiredLocks } from '@/lib/collaboration/lock'

export type TaskType = 
  | 'expiration_check'
  | 'notification_send'
  | 'cleanup_logs'
  | 'backup'
  | 'cleanup_locks'

export interface TaskResult {
  success: boolean
  message?: string
  data?: any
  error?: string
}

/**
 * Task handlers for each task type
 */
const taskHandlers: Record<TaskType, () => Promise<TaskResult>> = {
  expiration_check: async () => {
    const result = await processExpirationAlerts()
    return {
      success: true,
      message: `Processados ${result.processed} documentos, ${result.alerts} alertas enviados, ${result.escalations} escalações`,
      data: result
    }
  },

  notification_send: async () => {
    // This is handled by the expiration_check task
    return {
      success: true,
      message: 'Notificações enviadas pelo processo de verificação de vencimentos'
    }
  },

  cleanup_logs: async () => {
    // Clean up old API request logs (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const deletedLogs = await db.apiRequestLog.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo }
      }
    })

    // Clean up old task executions (older than 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    
    const deletedExecutions = await db.taskExecution.deleteMany({
      where: {
        startedAt: { lt: ninetyDaysAgo }
      }
    })

    return {
      success: true,
      message: `Removidos ${deletedLogs.count} logs de API e ${deletedExecutions.count} execuções antigas`,
      data: {
        deletedLogs: deletedLogs.count,
        deletedExecutions: deletedExecutions.count
      }
    }
  },

  backup: async () => {
    const result = await createBackup({ type: 'full' })
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }

    // Cleanup old backups (keep last 10)
    const deleted = await cleanupOldBackups(10)

    return {
      success: true,
      message: `Backup criado: ${result.filename}`,
      data: {
        backupId: result.backupId,
        filename: result.filename,
        fileSize: result.fileSize,
        deletedOldBackups: deleted
      }
    }
  },

  cleanup_locks: async () => {
    const count = await cleanupExpiredLocks()
    return {
      success: true,
      message: `Removidos ${count} locks expirados`,
      data: { removedLocks: count }
    }
  }
}

/**
 * Execute a scheduled task
 */
export async function executeTask(taskId: string): Promise<TaskResult> {
  const task = await db.scheduledTask.findUnique({
    where: { id: taskId }
  })

  if (!task) {
    return { success: false, error: 'Tarefa não encontrada' }
  }

  if (!task.enabled) {
    return { success: false, error: 'Tarefa está desabilitada' }
  }

  // Check if already running
  if (task.status === 'RUNNING') {
    return { success: false, error: 'Tarefa já está em execução' }
  }

  const startTime = Date.now()

  // Update task status
  await db.scheduledTask.update({
    where: { id: taskId },
    data: {
      status: 'RUNNING',
      runningSince: new Date()
    }
  })

  // Create execution record
  const execution = await db.taskExecution.create({
    data: {
      taskId,
      status: 'running'
    }
  })

  try {
    // Execute task
    const handler = taskHandlers[task.taskType as TaskType]
    
    if (!handler) {
      throw new Error(`Handler não encontrado para tipo: ${task.taskType}`)
    }

    const result = await handler()

    const duration = Math.round((Date.now() - startTime) / 1000)

    // Update task
    await db.scheduledTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        lastRunAt: new Date(),
        lastDuration: duration,
        lastResult: JSON.stringify(result.data),
        runCount: { increment: 1 },
        runningSince: null,
        nextRunAt: calculateNextRun(task.cronExpression)
      }
    })

    // Update execution
    await db.taskExecution.update({
      where: { id: execution.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        duration,
        result: JSON.stringify(result.data)
      }
    })

    return result
  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Update task
    await db.scheduledTask.update({
      where: { id: taskId },
      data: {
        status: 'FAILED',
        lastError: errorMessage,
        lastDuration: duration,
        failCount: { increment: 1 },
        runningSince: null
      }
    })

    // Update execution
    await db.taskExecution.update({
      where: { id: execution.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        duration,
        error: errorMessage
      }
    })

    return { success: false, error: errorMessage }
  }
}

/**
 * Calculate next run time based on cron expression
 */
function calculateNextRun(cronExpression: string | null): Date | null {
  if (!cronExpression) return null

  // Simple cron parser for basic expressions
  // Supports: every hour (0 * * * *), every day (0 0 * * *), every week (0 0 * * 0)
  const parts = cronExpression.split(' ')
  if (parts.length !== 5) return null

  const now = new Date()
  const next = new Date(now)

  const minute = parseInt(parts[0])
  const hour = parseInt(parts[1])
  const dayOfMonth = parts[2]
  const month = parts[3]
  const dayOfWeek = parts[4]

  // Every hour
  if (cronExpression === '0 * * * *') {
    next.setHours(next.getHours() + 1, 0, 0, 0)
    return next
  }

  // Every day at specific time
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    next.setHours(hour, minute, 0, 0)
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
    return next
  }

  // Default: run in 1 hour
  next.setHours(next.getHours() + 1)
  return next
}

/**
 * Initialize default scheduled tasks
 */
export async function initializeScheduledTasks(): Promise<void> {
  const defaultTasks = [
    {
      name: 'Verificação de Vencimentos',
      taskType: 'expiration_check',
      cronExpression: '0 * * * *', // Every hour
      description: 'Verifica documentos vencendo e envia alertas'
    },
    {
      name: 'Backup Automático',
      taskType: 'backup',
      cronExpression: '0 2 * * *', // Every day at 2 AM
      description: 'Cria backup completo do banco de dados'
    },
    {
      name: 'Limpeza de Logs',
      taskType: 'cleanup_logs',
      cronExpression: '0 3 * * 0', // Every Sunday at 3 AM
      description: 'Remove logs antigos (mais de 30 dias)'
    },
    {
      name: 'Limpeza de Locks',
      taskType: 'cleanup_locks',
      cronExpression: '0 */6 * * *', // Every 6 hours
      description: 'Remove locks de documento expirados'
    }
  ]

  for (const taskData of defaultTasks) {
    const existing = await db.scheduledTask.findFirst({
      where: { taskType: taskData.taskType }
    })

    if (!existing) {
      await db.scheduledTask.create({
        data: {
          ...taskData,
          status: 'SCHEDULED',
          enabled: true,
          nextRunAt: calculateNextRun(taskData.cronExpression)
        }
      })
    }
  }
}

/**
 * Process all due tasks
 */
export async function processDueTasks(): Promise<{ processed: number; results: any[] }> {
  const now = new Date()

  const dueTasks = await db.scheduledTask.findMany({
    where: {
      enabled: true,
      status: { not: 'RUNNING' },
      nextRunAt: { lte: now }
    }
  })

  const results = []

  for (const task of dueTasks) {
    const result = await executeTask(task.id)
    results.push({
      taskId: task.id,
      taskName: task.name,
      ...result
    })
  }

  return {
    processed: dueTasks.length,
    results
  }
}
