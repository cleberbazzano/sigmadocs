'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Lock,
  Unlock,
  Loader2,
  User,
  Clock,
  AlertTriangle
} from 'lucide-react'

interface LockInfo {
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

interface DocumentLockBannerProps {
  documentId: string
  userId: string
  userRole: string
  onLockAcquired?: () => void
  onLockReleased?: () => void
}

function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date()
  const diff = new Date(expiresAt).getTime() - now.getTime()
  
  if (diff <= 0) return 'Expirado'
  
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  
  return `${minutes}m ${seconds}s`
}

export function DocumentLockBanner({
  documentId,
  userId,
  userRole,
  onLockAcquired,
  onLockReleased
}: DocumentLockBannerProps) {
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState('')

  const fetchLockInfo = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/lock`)
      if (response.ok) {
        const data = await response.json()
        setLockInfo(data)
      }
    } catch (error) {
      console.error('Error fetching lock info:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLockInfo()
  }, [documentId])

  // Update time remaining every second
  useEffect(() => {
    if (!lockInfo?.isLocked || !lockInfo?.expiresAt) return
    
    const updateTimer = () => {
      setTimeRemaining(formatTimeRemaining(lockInfo.expiresAt!))
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [lockInfo?.isLocked, lockInfo?.expiresAt])

  const handleAcquireLock = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/lock`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchLockInfo()
        onLockAcquired?.()
      } else {
        const error = await response.json()
        alert('Erro ao bloquear documento: ' + error.error)
      }
    } catch (error) {
      alert('Erro ao bloquear documento')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReleaseLock = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/lock`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchLockInfo()
        onLockReleased?.()
      }
    } catch (error) {
      console.error('Error releasing lock:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return null
  }

  // Not locked
  if (!lockInfo?.isLocked) {
    return (
      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4">
        <div className="flex items-center gap-2 text-slate-600">
          <Unlock className="h-4 w-4" />
          <span className="text-sm">Documento desbloqueado</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAcquireLock}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Lock className="h-4 w-4 mr-2" />
          )}
          Bloquear para Edição
        </Button>
      </div>
    )
  }

  // Locked by current user
  if (lockInfo.isOwnLock) {
    return (
      <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-100 rounded">
            <Lock className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-emerald-800">
                Você está editando este documento
              </span>
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                <Clock className="h-3 w-3 mr-1" />
                {timeRemaining} restantes
              </Badge>
            </div>
            <span className="text-xs text-emerald-600">
              O bloqueio expira automaticamente após 30 minutos de inatividade
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReleaseLock}
          disabled={actionLoading}
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Unlock className="h-4 w-4 mr-2" />
          )}
          Liberar
        </Button>
      </div>
    )
  }

  // Locked by another user
  return (
    <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-amber-100 rounded">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-amber-800">
              Documento bloqueado por {lockInfo.lockedBy?.name || 'outro usuário'}
            </span>
            {lockInfo.expiresAt && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                <Clock className="h-3 w-3 mr-1" />
                {timeRemaining} restantes
              </Badge>
            )}
          </div>
          <span className="text-xs text-amber-600">
            Aguarde o bloqueio expirar ou solicite a liberação
          </span>
        </div>
      </div>
      {userRole === 'ADMIN' && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleReleaseLock}
          disabled={actionLoading}
          className="border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Unlock className="h-4 w-4 mr-2" />
          )}
          Forçar Liberação
        </Button>
      )}
    </div>
  )
}
