import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  try {
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
    
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        department: session.user.department,
        avatar: session.user.avatar
      }
    })
    
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
