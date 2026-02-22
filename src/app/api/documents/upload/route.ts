import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
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
    
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Sessão expirada' },
        { status: 401 }
      )
    }
    
    // Processar formData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const documentType = formData.get('documentType') as string
    const confidentiality = formData.get('confidentiality') as string || 'INTERNAL'
    const keywords = formData.get('keywords') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      )
    }
    
    // Validar tamanho (máx 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (máx. 50MB)' },
        { status: 400 }
      )
    }
    
    // Gerar nome único para o arquivo
    const fileExtension = path.extname(file.name)
    const uniqueFileName = `${crypto.randomUUID()}${fileExtension}`
    
    // Criar diretório de uploads se não existir
    const uploadsDir = path.join(process.cwd(), 'uploads')
    await mkdir(uploadsDir, { recursive: true })
    
    // Salvar arquivo
    const filePath = path.join(uploadsDir, uniqueFileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    // Calcular hash SHA-256
    const fileHash = crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex')
    
    // Criar documento no banco
    const document = await db.document.create({
      data: {
        title: title || file.name,
        description,
        fileName: file.name,
        filePath: uniqueFileName,
        fileSize: file.size,
        mimeType: file.type,
        fileHash,
        keywords,
        confidentiality: confidentiality as any,
        categoryId: category || null,
        typeId: documentType || null,
        authorId: session.user.id,
        status: 'DRAFT',
        department: session.user.department
      }
    })
    
    // Criar log de auditoria
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'Document',
        entityId: document.id,
        documentId: document.id,
        details: JSON.stringify({
          title: document.title,
          fileName: document.fileName,
          fileSize: document.fileSize
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })
    
    // Simular processamento por IA (em produção seria assíncrono)
    const aiCategory = await simulateAIProcessing(file.name, title, description)
    
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title
      },
      aiCategory
    })
    
  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { error: 'Erro no upload do documento' },
      { status: 500 }
    )
  }
}

// Simular processamento de IA
async function simulateAIProcessing(fileName: string, title?: string | null, description?: string | null): Promise<string> {
  // Em produção, isso chamaria o z-ai-web-dev-sdk para processar
  const categories = ['Contratos', 'Relatórios', 'Políticas', 'Financeiro', 'Jurídico', 'RH']
  return categories[Math.floor(Math.random() * categories.length)]
}
