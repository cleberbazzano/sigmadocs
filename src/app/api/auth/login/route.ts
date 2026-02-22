import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { authenticateUser, createSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Check for default admin user creation
    let user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    
    // Create default admin user if not exists (for demo)
    if (!user && email.toLowerCase() === 'admin@sigmadocs.com.br') {
      const passwordHash = await hashPassword('admin123')
      user = await db.user.create({
        data: {
          email: 'admin@sigmadocs.com.br',
          name: 'Administrador',
          passwordHash,
          role: 'ADMIN',
          department: 'TI',
          active: true
        }
      })
    }
    
    // Also check old admin email for migration
    if (!user && email.toLowerCase() === 'admin@ged.com') {
      const passwordHash = await hashPassword('admin123')
      user = await db.user.create({
        data: {
          email: 'admin@ged.com',
          name: 'Administrador',
          passwordHash,
          role: 'ADMIN',
          department: 'TI',
          active: true
        }
      })
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      )
    }
    
    // Check if user is active
    if (!user.active) {
      return NextResponse.json(
        { error: 'Usuário inativo. Entre em contato com o administrador.' },
        { status: 403 }
      )
    }
    
    // Authenticate user with new system
    const authResult = await authenticateUser(email, password, ipAddress, userAgent)
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }
    
    // Create session
    const sessionToken = await createSession(authResult.user.id, ipAddress, userAgent)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/'
    })
    
    // Get expiration alerts count for response
    const expiringDocs = await db.document.count({
      where: {
        authorId: authResult.user.id,
        expirationDate: {
          not: null,
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        },
        status: { notIn: ['CANCELLED', 'ARCHIVED'] }
      }
    })
    
    return NextResponse.json({
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        role: authResult.user.role,
        department: authResult.user.department,
        avatar: authResult.user.avatar
      },
      alerts: {
        expiringDocuments: expiringDocs,
        passwordMigrated: authResult.needsPasswordReset
      }
    })
    
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
