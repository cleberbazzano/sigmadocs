import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Configurações padrão do sistema (v3.0)
const defaultConfig = {
  logoUrl: '/logo-light.png',
  logoUrlDark: '/logo-dark.png',
  faviconUrl: '/logo-dark.png',
  theme: 'system',
  systemName: 'Sigma DOCs',
  systemDescription: 'Sistema de Gestão Eletrônica de Documentos',
  companyName: 'Sigma DOCs',
  companyLogo: '/logo-dark.png',
  version: '3.0.0',
  versionDate: '2025-01-15',
  lastUpdate: 'Correções de segurança e melhorias de performance'
}

// GET - Obter configurações públicas (sem autenticação)
export async function GET() {
  try {
    // Buscar configurações do sistema
    const configs = await db.systemConfig.findMany({
      where: {
        key: { in: ['logoUrl', 'logoUrlDark', 'faviconUrl', 'theme', 'systemName', 'systemDescription', 'version', 'versionDate', 'lastUpdate'] }
      }
    })
    
    const config: Record<string, string> = { ...defaultConfig }
    configs.forEach(c => {
      config[c.key] = c.value
    })
    
    // Buscar dados da empresa
    const company = await db.company.findFirst()
    
    // Se existe empresa cadastrada, usar dados da empresa
    if (company) {
      config.companyName = company.nomeFantasia || company.razaoSocial
      if (company.logo) {
        config.companyLogo = company.logo
      }
    }
    
    return NextResponse.json({ config, company })
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ config: defaultConfig })
  }
}

// PUT - Atualizar configurações (requer admin)
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
    const { logoUrl, logoUrlDark, faviconUrl, theme, systemName, systemDescription, version, versionDate, lastUpdate } = body

    const updates = []
    
    const configItems = [
      { key: 'logoUrl', value: logoUrl },
      { key: 'logoUrlDark', value: logoUrlDark },
      { key: 'faviconUrl', value: faviconUrl },
      { key: 'theme', value: theme },
      { key: 'systemName', value: systemName },
      { key: 'systemDescription', value: systemDescription },
      { key: 'version', value: version },
      { key: 'versionDate', value: versionDate },
      { key: 'lastUpdate', value: lastUpdate }
    ]

    for (const item of configItems) {
      if (item.value !== undefined) {
        updates.push(
          db.systemConfig.upsert({
            where: { key: item.key },
            create: { key: item.key, value: item.value, updatedBy: user.id },
            update: { value: item.value, updatedBy: user.id }
          })
        )
      }
    }

    await Promise.all(updates)

    // Log de auditoria
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'SystemConfig',
        entityId: 'system',
        details: JSON.stringify(body),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 })
  }
}
