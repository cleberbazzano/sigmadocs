import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar autenticação
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    // Buscar documento
    const document = await db.document.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        type: { select: { id: true, name: true } },
        signatures: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    })
    
    if (!document) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }
    
    // Criar log de acesso
    const session = await db.session.findUnique({
      where: { token: sessionToken }
    })
    
    if (session) {
      await db.auditLog.create({
        data: {
          userId: session.userId,
          action: 'READ',
          entityType: 'Document',
          entityId: document.id,
          documentId: document.id,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })
    }
    
    return NextResponse.json({ document })
    
  } catch (error) {
    console.error('Erro ao buscar documento:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar documento' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar autenticação
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    })
    
    if (!session) {
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401 }
      )
    }
    
    // Verificar permissão (Admin ou autor)
    const document = await db.document.findUnique({
      where: { id }
    })
    
    if (!document) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }
    
    if (session.user.role !== 'ADMIN' && document.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir este documento' },
        { status: 403 }
      )
    }
    
    // Excluir documento
    await db.document.delete({
      where: { id }
    })
    
    // Log de auditoria
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'Document',
        entityId: id,
        details: JSON.stringify({
          title: document.title,
          fileName: document.fileName
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erro ao excluir documento:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir documento' },
      { status: 500 }
    )
  }
}
