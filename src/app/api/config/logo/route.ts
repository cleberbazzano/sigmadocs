import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'

// POST - Upload de logo ou favicon
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo', 'logoDark' ou 'favicon'

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }

    if (!['logo', 'logoDark', 'favicon'].includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido. Use: logo, logoDark ou favicon' }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use PNG, JPG, SVG ou ICO.' }, { status: 400 })
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 2MB.' }, { status: 400 })
    }

    // Gerar nome do arquivo
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${type}-${Date.now()}.${ext}`
    
    // Criar diretório se não existir
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      await writeFile(path.join(uploadsDir, '.gitkeep'), '')
    } catch (e) {
      // Diretório já existe
    }

    // Salvar arquivo
    const filePath = path.join(uploadsDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // URL pública
    const publicUrl = `/uploads/${fileName}`

    // Mapear tipo para chave de configuração
    const configKey = type === 'logoDark' ? 'logoUrlDark' : type === 'logo' ? 'logoUrl' : 'faviconUrl'

    // Buscar configuração anterior para deletar arquivo antigo
    const oldConfig = await db.systemConfig.findUnique({
      where: { key: configKey }
    })

    // Atualizar configuração
    await db.systemConfig.upsert({
      where: { key: configKey },
      create: { key: configKey, value: publicUrl, updatedBy: user.id },
      update: { value: publicUrl, updatedBy: user.id }
    })

    // Deletar arquivo antigo (se não for o padrão)
    if (oldConfig?.value && oldConfig.value.startsWith('/uploads/')) {
      try {
        const oldPath = path.join(process.cwd(), 'public', oldConfig.value)
        await unlink(oldPath)
      } catch (e) {
        // Arquivo não existe, ignorar
      }
    }

    // Log de auditoria
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'SystemConfig',
        entityId: type,
        details: JSON.stringify({ type, url: publicUrl }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ error: 'Erro no upload' }, { status: 500 })
  }
}

// DELETE - Resetar logo ou favicon para padrão
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!['logo', 'logoDark', 'favicon'].includes(type || '')) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    // Mapear tipo para chave de configuração
    const configKey = type === 'logoDark' ? 'logoUrlDark' : type === 'logo' ? 'logoUrl' : 'faviconUrl'

    // Buscar configuração anterior para deletar arquivo
    const oldConfig = await db.systemConfig.findUnique({
      where: { key: configKey }
    })

    // Deletar arquivo antigo (se não for o padrão)
    if (oldConfig?.value && oldConfig.value.startsWith('/uploads/')) {
      try {
        const oldPath = path.join(process.cwd(), 'public', oldConfig.value)
        await unlink(oldPath)
      } catch (e) {
        // Arquivo não existe, ignorar
      }
    }

    // Resetar para padrão
    const defaultValues: Record<string, string> = {
      logoUrl: '/logo-light.png',
      logoUrlDark: '/logo-dark.png',
      faviconUrl: '/logo-dark.png'
    }
    const defaultValue = defaultValues[configKey] || '/logo-dark.png'
    await db.systemConfig.upsert({
      where: { key: configKey },
      create: { key: configKey, value: defaultValue, updatedBy: user.id },
      update: { value: defaultValue, updatedBy: user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao resetar:', error)
    return NextResponse.json({ error: 'Erro ao resetar' }, { status: 500 })
  }
}
