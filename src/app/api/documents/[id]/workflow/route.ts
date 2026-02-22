import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - Get workflow for a document
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

    const workflow = await db.approvalWorkflow.findFirst({
      where: { documentId: id },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        }
      }
    })

    if (!workflow) {
      return NextResponse.json({ workflow: null })
    }

    // Get approver details for each step
    const stepsWithDetails = await Promise.all(
      workflow.steps.map(async (step) => {
        let approver = null
        if (step.userId) {
          approver = await db.user.findUnique({
            where: { id: step.userId },
            select: { id: true, name: true, email: true }
          })
        }
        return {
          ...step,
          approver
        }
      })
    )

    return NextResponse.json({
      workflow: {
        ...workflow,
        steps: stepsWithDetails
      }
    })
  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json({ error: 'Erro ao buscar workflow' }, { status: 500 })
  }
}

// POST - Create workflow
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
    const body = await request.json()
    const { name, description, type, steps } = body

    // Validate input
    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'Nome e etapas são obrigatórios' }, { status: 400 })
    }

    // Check if document exists and user can create workflow
    const document = await db.document.findUnique({
      where: { id },
      select: { id: true, authorId: true, status: true }
    })

    if (!document) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    if (document.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão para criar workflow' }, { status: 403 })
    }

    // Check if workflow already exists
    const existingWorkflow = await db.approvalWorkflow.findFirst({
      where: { documentId: id }
    })

    if (existingWorkflow) {
      return NextResponse.json({ error: 'Já existe um workflow para este documento' }, { status: 400 })
    }

    // Create workflow with steps
    const workflow = await db.approvalWorkflow.create({
      data: {
        documentId: id,
        name,
        description,
        type: type || 'SEQUENTIAL',
        status: 'DRAFT',
        totalSteps: steps.length,
        steps: {
          create: steps.map((step: any, index: number) => ({
            stepNumber: index + 1,
            name: step.name,
            userId: step.userId || null,
            roleId: step.roleId || null,
            departmentId: step.departmentId || null,
            status: 'pending'
          }))
        }
      },
      include: {
        steps: true
      }
    })

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'ApprovalWorkflow',
        entityId: workflow.id,
        documentId: id,
        details: JSON.stringify({ name, totalSteps: steps.length }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ success: true, workflow })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json({ error: 'Erro ao criar workflow' }, { status: 500 })
  }
}

// PUT - Start workflow or approve/reject step
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, stepId, comments, rejectionReason } = body

    const workflow = await db.approvalWorkflow.findFirst({
      where: { documentId: id },
      include: { steps: { orderBy: { stepNumber: 'asc' } } }
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow não encontrado' }, { status: 404 })
    }

    // Start workflow
    if (action === 'start') {
      if (workflow.status !== 'DRAFT') {
        return NextResponse.json({ error: 'Workflow já iniciado' }, { status: 400 })
      }

      // Update document status
      await db.document.update({
        where: { id },
        data: { status: 'PENDING' }
      })

      const updatedWorkflow = await db.approvalWorkflow.update({
        where: { id: workflow.id },
        data: {
          status: 'ACTIVE',
          startedAt: new Date(),
          currentStep: 1
        }
      })

      // Log audit
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          entityType: 'ApprovalWorkflow',
          entityId: workflow.id,
          documentId: id,
          details: JSON.stringify({ action: 'start' }),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })

      return NextResponse.json({ success: true, workflow: updatedWorkflow })
    }

    // Approve step
    if (action === 'approve') {
      if (!stepId) {
        return NextResponse.json({ error: 'ID da etapa é obrigatório' }, { status: 400 })
      }

      const step = await db.approvalStep.findUnique({
        where: { id: stepId }
      })

      if (!step || step.workflowId !== workflow.id) {
        return NextResponse.json({ error: 'Etapa não encontrada' }, { status: 404 })
      }

      // Check if user can approve this step
      const canApprove = step.userId === user.id ||
        (step.roleId && user.role === step.roleId) ||
        user.role === 'ADMIN'

      if (!canApprove) {
        return NextResponse.json({ error: 'Sem permissão para aprovar esta etapa' }, { status: 403 })
      }

      // Update step
      await db.approvalStep.update({
        where: { id: stepId },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          comments
        }
      })

      // Check if all steps approved or move to next step
      const allSteps = await db.approvalStep.findMany({
        where: { workflowId: workflow.id }
      })

      const allApproved = allSteps.every(s => s.status === 'approved')
      const anyRejected = allSteps.some(s => s.status === 'rejected')

      if (anyRejected) {
        // Workflow rejected
        await db.approvalWorkflow.update({
          where: { id: workflow.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date()
          }
        })
      } else if (allApproved) {
        // Workflow completed
        await db.approvalWorkflow.update({
          where: { id: workflow.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })

        // Update document status
        await db.document.update({
          where: { id },
          data: { status: 'APPROVED' }
        })
      } else {
        // Move to next step
        const currentStepIndex = allSteps.findIndex(s => s.id === stepId)
        const nextStep = allSteps[currentStepIndex + 1]

        if (nextStep && workflow.type === 'SEQUENTIAL') {
          await db.approvalWorkflow.update({
            where: { id: workflow.id },
            data: { currentStep: nextStep.stepNumber }
          })
        }
      }

      // Log audit
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'APPROVE',
          entityType: 'ApprovalStep',
          entityId: stepId,
          documentId: id,
          details: JSON.stringify({ comments }),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })

      return NextResponse.json({ success: true })
    }

    // Reject step
    if (action === 'reject') {
      if (!stepId) {
        return NextResponse.json({ error: 'ID da etapa é obrigatório' }, { status: 400 })
      }

      if (!rejectionReason) {
        return NextResponse.json({ error: 'Justificativa de rejeição é obrigatória' }, { status: 400 })
      }

      const step = await db.approvalStep.findUnique({
        where: { id: stepId }
      })

      if (!step || step.workflowId !== workflow.id) {
        return NextResponse.json({ error: 'Etapa não encontrada' }, { status: 404 })
      }

      // Update step
      await db.approvalStep.update({
        where: { id: stepId },
        data: {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: user.id,
          rejectionReason,
          comments
        }
      })

      // Cancel workflow
      await db.approvalWorkflow.update({
        where: { id: workflow.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      })

      // Log audit
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'REJECT',
          entityType: 'ApprovalStep',
          entityId: stepId,
          documentId: id,
          details: JSON.stringify({ rejectionReason, comments }),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json({ error: 'Erro ao atualizar workflow' }, { status: 500 })
  }
}
