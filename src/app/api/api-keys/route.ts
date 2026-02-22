import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import crypto from 'crypto'

// Generate secure API key
function generateApiKey(): { key: string; hash: string; prefix: string } {
  // Generate 32 bytes of random data
  const randomBytes = crypto.randomBytes(32)
  const key = `sk_${randomBytes.toString('base64url')}`
  
  // Create hash for storage
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  
  // Extract prefix for display (first 12 characters after sk_)
  const prefix = key.substring(0, 15) + '...'
  
  return { key, hash, prefix }
}

// GET - List API keys
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const keys = await db.apiKey.findMany({
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        rateLimit: true,
        active: true,
        lastUsedAt: true,
        usageCount: true,
        expiresAt: true,
        description: true,
        createdAt: true,
        userId: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json({ error: 'Erro ao buscar API keys' }, { status: 500 })
  }
}

// POST - Create API key
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { name, permissions, rateLimit, expiresInDays, description, allowedIps } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const { key, hash, prefix } = generateApiKey()

    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    const apiKey = await db.apiKey.create({
      data: {
        name,
        key: hash,
        keyPrefix: prefix,
        userId: user.id,
        permissions: JSON.stringify(permissions || ['read']),
        rateLimit: rateLimit || 1000,
        expiresAt,
        description,
        allowedIps: allowedIps ? JSON.stringify(allowedIps) : null
      }
    })

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'ApiKey',
        entityId: apiKey.id,
        details: JSON.stringify({ name, permissions }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Return the full key only once
    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key, // Full key - shown only once!
        prefix: apiKey.keyPrefix,
        permissions: JSON.parse(apiKey.permissions),
        expiresAt: apiKey.expiresAt
      },
      warning: 'Guarde esta chave em local seguro. Ela não será exibida novamente.'
    })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json({ error: 'Erro ao criar API key' }, { status: 500 })
  }
}

// DELETE - Revoke API key
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    await db.apiKey.delete({ where: { id } })

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'ApiKey',
        entityId: id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json({ error: 'Erro ao excluir API key' }, { status: 500 })
  }
}

// PUT - Update API key
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
    const { id, active, rateLimit } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const updateData: any = {}
    if (active !== undefined) updateData.active = active
    if (rateLimit !== undefined) updateData.rateLimit = rateLimit

    const apiKey = await db.apiKey.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, apiKey })
  } catch (error) {
    console.error('Error updating API key:', error)
    return NextResponse.json({ error: 'Erro ao atualizar API key' }, { status: 500 })
  }
}
