import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

interface ApiKeyValidation {
  valid: boolean
  apiKey?: {
    id: string
    userId: string
    permissions: string[]
    rateLimit: number
    usageCount: number
  }
  error?: string
}

/**
 * Validate API key from request header
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyValidation> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return { valid: false, error: 'Authorization header required' }
  }

  // Support Bearer token format
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader

  if (!token || !token.startsWith('sk_')) {
    return { valid: false, error: 'Invalid API key format' }
  }

  // Hash the provided key
  const hash = crypto.createHash('sha256').update(token).digest('hex')

  // Find API key
  const apiKey = await db.apiKey.findUnique({
    where: { key: hash }
  })

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' }
  }

  // Check if active
  if (!apiKey.active) {
    return { valid: false, error: 'API key is inactive' }
  }

  // Check expiration
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    return { valid: false, error: 'API key has expired' }
  }

  // Check IP whitelist
  if (apiKey.allowedIps) {
    const allowedIps = JSON.parse(apiKey.allowedIps)
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    
    if (allowedIps.length > 0 && !allowedIps.includes(clientIp)) {
      return { valid: false, error: 'IP not allowed' }
    }
  }

  // Check rate limit (simple implementation)
  // In production, use Redis or similar for proper rate limiting
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentRequests = await db.apiRequestLog.count({
    where: {
      apiKeyId: apiKey.id,
      createdAt: { gte: oneHourAgo }
    }
  })

  if (recentRequests >= apiKey.rateLimit) {
    return { valid: false, error: 'Rate limit exceeded' }
  }

  // Update last used
  await db.apiKey.update({
    where: { id: apiKey.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 }
    }
  })

  return {
    valid: true,
    apiKey: {
      id: apiKey.id,
      userId: apiKey.userId,
      permissions: JSON.parse(apiKey.permissions),
      rateLimit: apiKey.rateLimit,
      usageCount: apiKey.usageCount
    }
  }
}

/**
 * Check if API key has permission
 */
export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes('*') || permissions.includes(permission)
}

/**
 * Log API request
 */
export async function logApiRequest(
  request: NextRequest,
  apiKeyId: string | null,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  error?: string
): Promise<void> {
  try {
    await db.apiRequestLog.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode,
        responseTime,
        error
      }
    })
  } catch (e) {
    console.error('Error logging API request:', e)
  }
}
