import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - List comments for a document
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
    const { searchParams } = new URL(request.url)
    const includeResolved = searchParams.get('includeResolved') === 'true'

    // Check if user has access to document
    const document = await db.document.findUnique({
      where: { id },
      select: { id: true, authorId: true, department: true, confidentiality: true }
    })

    if (!document) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    // Build where clause
    const where: any = { documentId: id }
    if (!includeResolved) {
      where.resolved = false
    }

    const comments = await db.documentComment.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get only top-level comments (parentId is null)
    const topLevelComments = comments.filter(c => !c.parentId)

    return NextResponse.json({
      comments: topLevelComments.map(c => ({
        id: c.id,
        content: c.content,
        author: c.author,
        resolved: c.resolved,
        resolvedAt: c.resolvedAt,
        resolvedBy: c.resolvedBy,
        replies: c.replies.map((r: any) => ({
          id: r.id,
          content: r.content,
          author: r.author,
          createdAt: r.createdAt
        })),
        createdAt: c.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Erro ao buscar comentários' }, { status: 500 })
  }
}

// POST - Create comment
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
    const { content, parentId } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Conteúdo do comentário é obrigatório' }, { status: 400 })
    }

    // Check if document exists
    const document = await db.document.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!document) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    // If replying, check parent exists
    if (parentId) {
      const parentComment = await db.documentComment.findUnique({
        where: { id: parentId }
      })
      if (!parentComment || parentComment.documentId !== id) {
        return NextResponse.json({ error: 'Comentário pai não encontrado' }, { status: 404 })
      }
    }

    // Create comment (NOT editable after creation)
    const comment = await db.documentComment.create({
      data: {
        documentId: id,
        authorId: user.id,
        content: content.trim(),
        parentId: parentId || null
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'DocumentComment',
        entityId: comment.id,
        documentId: id,
        details: JSON.stringify({ content: content.substring(0, 100) }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Log interaction
    await db.documentInteraction.create({
      data: {
        documentId: id,
        userId: user.id,
        action: 'comment',
        details: JSON.stringify({ commentId: comment.id })
      }
    })

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        author: comment.author,
        createdAt: comment.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Erro ao criar comentário' }, { status: 500 })
  }
}

// PUT - Resolve/unresolve comment
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
    const { commentId, resolved } = body

    if (!commentId) {
      return NextResponse.json({ error: 'ID do comentário é obrigatório' }, { status: 400 })
    }

    const comment = await db.documentComment.findUnique({
      where: { id: commentId },
      include: { document: { select: { id: true, authorId: true } } }
    })

    if (!comment || comment.documentId !== id) {
      return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 })
    }

    // Only document author or admin can resolve
    if (comment.document.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão para resolver este comentário' }, { status: 403 })
    }

    const updatedComment = await db.documentComment.update({
      where: { id: commentId },
      data: {
        resolved,
        resolvedAt: resolved ? new Date() : null,
        resolvedBy: resolved ? user.id : null
      }
    })

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'DocumentComment',
        entityId: commentId,
        documentId: id,
        details: JSON.stringify({ action: resolved ? 'resolve' : 'unresolve' }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ success: true, comment: updatedComment })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Erro ao atualizar comentário' }, { status: 500 })
  }
}
