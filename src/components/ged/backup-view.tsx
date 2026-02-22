'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  HardDrive,
  Calendar,
  FileCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react'

interface Backup {
  id: string
  filename: string
  fileSize: number
  type: string
  status: string
  documentsCount: number | null
  usersCount: number | null
  totalRecords: number | null
  completedAt: string | null
  isAutomatic: boolean
}

interface BackupStats {
  totalBackups: number
  totalSize: number
  latestBackup: {
    id: string
    filename: string
    completedAt: string
    documentsCount: number | null
    usersCount: number | null
  } | null
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(date: string | Date | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleString('pt-BR')
}

export function BackupView() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [backupsRes, statsRes] = await Promise.all([
        fetch('/api/backup'),
        fetch('/api/backup?stats=true')
      ])
      
      if (backupsRes.ok) {
        const data = await backupsRes.json()
        setBackups(data.backups || [])
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching backup data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateBackup = async () => {
    setCreating(true)
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'full' })
      })

      if (response.ok) {
        await fetchData()
      } else {
        const error = await response.json()
        alert('Erro ao criar backup: ' + error.error)
      }
    } catch (error) {
      alert('Erro ao criar backup')
    } finally {
      setCreating(false)
    }
  }

  const handleRestore = async () => {
    if (!selectedBackupId) return
    
    setRestoringId(selectedBackupId)
    try {
      const response = await fetch(`/api/backup/${selectedBackupId}/restore`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Backup restaurado com sucesso! A página será recarregada.')
        window.location.reload()
      } else {
        const error = await response.json()
        alert('Erro ao restaurar backup: ' + error.error)
      }
    } catch (error) {
      alert('Erro ao restaurar backup')
    } finally {
      setRestoringId(null)
      setRestoreDialogOpen(false)
      setSelectedBackupId(null)
    }
  }

  const handleCleanup = async () => {
    try {
      const response = await fetch('/api/backup?keep=10', {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2; label: string }> = {
      completed: { variant: 'default', icon: CheckCircle2, label: 'Concluído' },
      pending: { variant: 'secondary', icon: Clock, label: 'Pendente' },
      failed: { variant: 'destructive', icon: XCircle, label: 'Falhou' },
      restoring: { variant: 'outline', icon: Loader2, label: 'Restaurando' }
    }
    const config = variants[status] || variants.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${status === 'restoring' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Backup e Restauração</h1>
          <p className="text-slate-500 mt-1">Gerencie backups do sistema e recupere dados</p>
        </div>
        <Button onClick={handleCreateBackup} disabled={creating}>
          {creating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          {creating ? 'Criando...' : 'Novo Backup'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total de Backups</CardTitle>
            <HardDrive className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBackups || 0}</div>
            <p className="text-xs text-slate-500">{formatBytes(stats?.totalSize || 0)} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Último Backup</CardTitle>
            <Calendar className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {stats?.latestBackup?.filename || 'Nenhum backup'}
            </div>
            <p className="text-xs text-slate-500">
              {stats?.latestBackup?.completedAt 
                ? formatDate(stats.latestBackup.completedAt)
                : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Status</CardTitle>
            <FileCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Saudável</div>
            <p className="text-xs text-slate-500">Backup automático ativo</p>
          </CardContent>
        </Card>
      </div>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Backups</CardTitle>
              <CardDescription>Lista de todos os backups realizados</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleCleanup}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Antigos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Nenhum backup encontrado</p>
              <p className="text-sm mt-1">Clique em "Novo Backup" para criar o primeiro</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Database className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium">{backup.filename}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>{formatBytes(backup.fileSize)}</span>
                        <span>•</span>
                        <span>{backup.documentsCount || 0} docs</span>
                        <span>•</span>
                        <span>{backup.usersCount || 0} usuários</span>
                        {backup.isAutomatic && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">Automático</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(backup.status)}
                    <span className="text-sm text-slate-500">
                      {formatDate(backup.completedAt)}
                    </span>
                    {backup.status === 'completed' && (
                      <AlertDialog open={restoreDialogOpen && selectedBackupId === backup.id}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBackupId(backup.id)
                              setRestoreDialogOpen(true)
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Restaurar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                              Confirmar Restauração
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação irá substituir todos os dados atuais pelos dados do backup selecionado.
                              Um backup do estado atual será criado automaticamente antes da restauração.
                              <br /><br />
                              <strong>Backup selecionado:</strong> {backup.filename}
                              <br />
                              <strong>Data:</strong> {formatDate(backup.completedAt)}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setRestoreDialogOpen(false)}>
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleRestore}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {restoringId ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              Restaurar Backup
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
