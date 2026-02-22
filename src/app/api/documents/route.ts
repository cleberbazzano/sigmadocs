import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, canAccessDocument } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Build filters with user-based access control
    const where: any = {}

    // Non-admin users can only see documents they have access to
    if (user.role !== 'ADMIN') {
      where.OR = [
        { authorId: user.id },
        { department: user.department },
        { confidentiality: 'PUBLIC' },
        { confidentiality: 'INTERNAL' }
      ]
    }
    
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { documentNumber: { contains: q } },
        { content: { contains: q } }
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    if (category) {
      where.categoryId = category
    }
    
    // Fetch documents
    const documents = await db.document.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        category: {
          select: { id: true, name: true }
        },
        type: {
          select: { id: true, name: true }
        },
        signatures: {
          where: { valid: true },
          select: {
            id: true,
            certificateCn: true,
            signatureDate: true,
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })
    
    // Filter documents based on detailed access control
    const accessibleDocs = documents.filter(doc => {
      return canAccessDocument(user, {
        authorId: doc.authorId,
        department: doc.department,
        confidentiality: doc.confidentiality
      })
    })
    
    // Total for pagination
    const total = await db.document.count({ where })
    
    // Format response
    const formattedDocs = accessibleDocs.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      status: doc.status,
      confidentiality: doc.confidentiality,
      categoryId: doc.categoryId,
      categoryName: doc.category?.name || null,
      typeName: doc.type?.name || null,
      authorName: doc.author.name,
      authorId: doc.author.id,
      expirationDate: doc.expirationDate?.toISOString() || null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      signedAt: doc.signedAt?.toISOString() || null,
      isSigned: doc.signatures.length > 0,
      signatures: doc.signatures.map(s => ({
        id: s.id,
        userName: s.user.name,
        signedAt: s.signatureDate.toISOString(),
        certificateCn: s.certificateCn || '',
        valid: true
      }))
    }))
    
    // Log access
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'READ',
        entityType: 'Document',
        entityId: 'list',
        details: JSON.stringify({ filters: { q, status, category }, count: formattedDocs.length }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    }).catch(() => {})
    
    return NextResponse.json({
      documents: formattedDocs,
      total,
      limit,
      offset
    })
    
  } catch (error) {
    console.error('Erro ao buscar documentos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar documentos' },
      { status: 500 }
    )
  }
}
