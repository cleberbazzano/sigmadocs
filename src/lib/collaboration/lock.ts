import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const LOCK_DURATION_MINUTES = 30 // Lock expira em 30 minutos

export interface DocumentLockInfo {
  isLocked: boolean
  lockedBy?: {
    id: string
    name: string
    email: string
  }
  lockedAt?: Date
  expiresAt?: Date
  isOwnLock: boolean
}

/**
 * Get lock information for a document
 */
export async function getDocumentLockInfo(documentId: string): Promise<DocumentLockInfo> {
  const lock = await db.documentLock.findUnique({
    where: { documentId },
    include: {
      document: {
        select: { authorId: true }
      }
    }
  })

  if (!lock) {
    return { isLocked: false }
  }

  // Check if lock expired
  if (new Date() > lock.expiresAt) {
    // Auto-release expired lock
    await db.documentLock.delete({ where: { id: lock.id } })
    return { isLocked: false }
  }

  const user = await getCurrentUser()

  return {
    isLocked: true,
    lockedBy: {
      id: lock.userId,
      name: '', // Will be filled by caller
      email: ''
    },
    lockedAt: lock.lockedAt,
    expiresAt: lock.expiresAt,
    isOwnLock: user?.id === lock.userId
  }
}

/**
 * Acquire lock on a document
 */
export async function acquireDocumentLock(
  documentId: string,
  userId: string,
  sessionId?: string
): Promise<{ success: boolean; lockId?: string; error?: string }> {
  // Check if document exists
  const document = await db.document.findUnique({
    where: { id: documentId },
    select: { id: true, status: true }
  })

  if (!document) {
    return { success: false, error: 'Documento não encontrado' }
  }

  // Check for existing lock
  const existingLock = await db.documentLock.findUnique({
    where: { documentId }
  })

  if (existingLock) {
    // Check if expired
    if (new Date() > existingLock.expiresAt) {
      // Release expired lock
      await db.documentLock.delete({ where: { id: existingLock.id } })
    } else if (existingLock.userId === userId) {
      // Extend own lock
      const newExpiresAt = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
      await db.documentLock.update({
        where: { id: existingLock.id },
        data: { expiresAt: newExpiresAt }
      })
      return { success: true, lockId: existingLock.id }
    } else {
      return { 
        success: false, 
        error: 'Documento está bloqueado por outro usuário' 
      }
    }
  }

  // Create new lock
  const expiresAt = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
  const lock = await db.documentLock.create({
    data: {
      documentId,
      userId,
      expiresAt,
      sessionId
    }
  })

  // Log interaction
  await logInteraction(documentId, userId, 'lock')

  return { success: true, lockId: lock.id }
}

/**
 * Release lock on a document
 */
export async function releaseDocumentLock(
  documentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const lock = await db.documentLock.findUnique({
    where: { documentId }
  })

  if (!lock) {
    return { success: true } // No lock, nothing to release
  }

  if (lock.userId !== userId) {
    // Admin can force release
    const user = await getCurrentUser()
    if (user?.role !== 'ADMIN') {
      return { 
        success: false, 
        error: 'Você não tem permissão para liberar este bloqueio' 
      }
    }
  }

  await db.documentLock.delete({ where: { id: lock.id } })

  // Log interaction
  await logInteraction(documentId, userId, 'unlock')

  return { success: true }
}

/**
 * Force release lock (admin only)
 */
export async function forceReleaseDocumentLock(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  const lock = await db.documentLock.findUnique({
    where: { documentId }
  })

  if (!lock) {
    return { success: true }
  }

  await db.documentLock.delete({ where: { id: lock.id } })
  return { success: true }
}

/**
 * Clean up expired locks (can be called by cron)
 */
export async function cleanupExpiredLocks(): Promise<number> {
  const result = await db.documentLock.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  })

  return result.count
}

/**
 * Log document interaction
 */
async function logInteraction(
  documentId: string,
  userId: string,
  action: string,
  details?: any
): Promise<void> {
  try {
    await db.documentInteraction.create({
      data: {
        documentId,
        userId,
        action,
        details: details ? JSON.stringify(details) : null
      }
    })
  } catch (error) {
    console.error('Error logging interaction:', error)
  }
}

/**
 * Get document interaction history
 */
export async function getDocumentInteractions(
  documentId: string,
  limit: number = 50
) {
  const interactions = await db.documentInteraction.findMany({
    where: { documentId },
    include: {
      document: {
        select: {
          author: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })

  // Get user names from author relation
  return interactions.map(i => ({
    id: i.id,
    userId: i.userId,
    userName: '', // Will be populated by caller
    action: i.action,
    details: i.details ? JSON.parse(i.details) : null,
    createdAt: i.createdAt
  }))
}
