import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST - Logout do usuário
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (user) {
      // Invalidar sessões do usuário
      await db.session.deleteMany({
        where: { userId: user.id }
      })

      // Log de auditoria
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGOUT',
          entityType: 'Session',
          entityId: user.id,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro no logout:', error)
    return NextResponse.json({ success: true }) // Sempre retorna sucesso para limpar o cliente
  }
}
