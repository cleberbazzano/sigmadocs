import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { executeTask, initializeScheduledTasks, processDueTasks } from '@/lib/scheduler/service'

// GET - List scheduled tasks
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const tasks = await db.scheduledTask.findMany({
      include: {
        executions: {
          take: 5,
          orderBy: { startedAt: 'desc' }
        }
      },
      orderBy: { nextRunAt: 'asc' }
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 })
  }
}

// POST - Execute or initialize tasks
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Allow cron secret for automated runs
    const cronSecret = request.headers.get('x-cron-secret')
    const validCronSecret = process.env.CRON_SECRET

    if (user.role !== 'ADMIN' && cronSecret !== validCronSecret) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { action, taskId } = body

    // Initialize default tasks
    if (action === 'initialize') {
      await initializeScheduledTasks()
      return NextResponse.json({ success: true, message: 'Tarefas padrão inicializadas' })
    }

    // Process all due tasks
    if (action === 'process-all') {
      const result = await processDueTasks()
      return NextResponse.json({
        success: true,
        processed: result.processed,
        results: result.results
      })
    }

    // Execute specific task
    if (action === 'execute' && taskId) {
      const result = await executeTask(taskId)
      
      // Log audit
      if (user) {
        await db.auditLog.create({
          data: {
            userId: user.id,
            action: 'UPDATE',
            entityType: 'ScheduledTask',
            entityId: taskId,
            details: JSON.stringify({ action: 'manual_execute', result }),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        })
      }

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    console.error('Error executing task:', error)
    return NextResponse.json({ error: 'Erro ao executar tarefa' }, { status: 500 })
  }
}

// PUT - Update task
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { taskId, enabled, cronExpression } = body

    if (!taskId) {
      return NextResponse.json({ error: 'ID da tarefa é obrigatório' }, { status: 400 })
    }

    const updateData: any = {}
    if (enabled !== undefined) updateData.enabled = enabled
    if (cronExpression) updateData.cronExpression = cronExpression

    const task = await db.scheduledTask.update({
      where: { id: taskId },
      data: updateData
    })

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 })
  }
}
