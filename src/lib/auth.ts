import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { cookies } from 'next/headers'
import { hashPassword, verifyPassword, needsRehash } from './password'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
  department: string | null
  avatar: string | null
}

/**
 * Get current authenticated user from session cookie
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) return null
    
    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    })
    
    if (!session || session.expiresAt < new Date()) {
      // Clean up expired session
      if (session) {
        await db.session.delete({ where: { id: session.id } })
      }
      return null
    }
    
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      department: session.user.department,
      avatar: session.user.avatar
    }
  } catch {
    return null
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(user: SessionUser, permission: string): Promise<boolean> {
  const permissions: Record<UserRole, string[]> = {
    ADMIN: ['*'],
    MANAGER: ['read', 'write', 'sign', 'approve', 'manage_department', 'export', 'share'],
    USER: ['read', 'write', 'sign', 'export'],
    VIEWER: ['read']
  }
  
  const userPermissions = permissions[user.role] || []
  return userPermissions.includes('*') || userPermissions.includes(permission)
}

/**
 * Check if user can access a document
 */
export async function canAccessDocument(user: SessionUser, document: { 
  authorId: string
  department: string | null
  confidentiality: string 
}): Promise<boolean> {
  // Admin has full access
  if (user.role === 'ADMIN') return true
  
  // Author always has access
  if (document.authorId === user.id) return true
  
  // Check confidentiality level
  const confidentialityLevels = ['PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL', 'SECRET']
  const docLevel = confidentialityLevels.indexOf(document.confidentiality)
  
  // SECRET documents only for admin
  if (document.confidentiality === 'SECRET') return false
  
  // Check department
  if (document.department && user.department !== document.department && user.role !== 'MANAGER') {
    return false
  }
  
  return true
}

/**
 * Authenticate user with email and password
 * Returns user object if successful, null otherwise
 */
export async function authenticateUser(
  email: string, 
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user: SessionUser; needsPasswordReset: boolean } | null> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() }
  })
  
  if (!user || !user.active) {
    // Log failed attempt
    await db.auditLog.create({
      data: {
        userId: user?.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user?.id || 'unknown',
        details: JSON.stringify({ email, reason: !user ? 'user_not_found' : 'user_inactive' }),
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown'
      }
    })
    return null
  }
  
  const isValid = await verifyPassword(password, user.passwordHash)
  
  if (!isValid) {
    // Log failed attempt
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        details: JSON.stringify({ email, reason: 'invalid_password' }),
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown'
      }
    })
    return null
  }
  
  // Check if password needs rehashing (migration from SHA-256)
  const needsReset = needsRehash(user.passwordHash)
  
  if (needsReset) {
    // Rehash password with bcrypt
    const newHash = await hashPassword(password)
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    })
  }
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      avatar: user.avatar
    },
    needsPasswordReset: needsReset
  }
}

/**
 * Create a new session for user
 */
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  
  await db.session.create({
    data: {
      userId,
      token,
      ipAddress,
      userAgent,
      expiresAt
    }
  })
  
  // Update last login
  await db.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() }
  })
  
  // Log successful login
  await db.auditLog.create({
    data: {
      userId,
      action: 'LOGIN',
      entityType: 'Session',
      entityId: token,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown'
    }
  })
  
  return token
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllSessions(userId: string): Promise<void> {
  await db.session.deleteMany({
    where: { userId }
  })
}

/**
 * Invalidate a specific session
 */
export async function invalidateSession(token: string): Promise<void> {
  await db.session.delete({
    where: { token }
  }).catch(() => {
    // Session might not exist
  })
}

// Re-export password functions
export { hashPassword, verifyPassword }
