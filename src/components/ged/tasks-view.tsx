'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Clock,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  History,
  Zap,
  Timer
} from 'lucide-react'

interface TaskExecution {
  id: string
  startedAt: string
  completedAt: string | null
  duration: number | null
  status: string
  error: string | null
  result: string | null
}

interface ScheduledTask {
  id: string
  name: string
  description: string | null
  taskType: string
  cronExpression: string | null
  nextRunAt: string | null
  lastRunAt: string | null
  status: string
  enabled: boolean
  lastDuration: number | null
  lastError: string | null
  runCount: number
  failCount: number
  lastResult: string | null
  executions: TaskExecution[]
}

function formatDate(date: string | Date | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleString('pt-BR')
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

function getCronDescription(cron: string | null): string {
  if (!cron) return 'Manual'
  
  const descriptions: Record<string, string> = {
    '0 * * * *': 'A cada hora',
    '0 */6 * * *': 'A cada 6 horas',
    '0 2 * * *': 'Diariamente às 02:00',
    '0 3 * * 0': 'Domingos às 03:00',
  }
  
  return descriptions[cron] || cron
}

const TASK_TYPE_INFO: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  expiration_check: { icon: Calendar, color: 'text-amber-500', label: 'Verificação de Vencimentos' },
  backup: { icon: Clock, color: 'text-blue-500', label: 'Backup Automático' },
  cleanup_logs: { icon: RefreshCw, color: 'text-purple-500', label: 'Limpeza de Logs' },
  cleanup_locks: { icon: Timer, color: 'text-pink-500', label: 'Limpeza de Locks' },
  notification_send: { icon: Zap, color: 'text-green-500', label: 'Envio de Notificações' },
}

export function TasksView() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(true)
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [initializing, setInitializing] = useState(false)

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleToggleTask = async (taskId: string, enabled: boolean) => {
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, enabled })
      })
      await fetchTasks()
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const handleExecuteTask = async (taskId: string) => {
    setExecutingId(taskId)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', taskId })
      })
      
      if (response.ok) {
        await fetchTasks()
      } else {
        const error = await response.json()
        alert('Erro ao executar tarefa: ' + error.error)
      }
    } catch (error) {
      alert('Erro ao executar tarefa')
    } finally {
      setExecutingId(null)
    }
  }

  const handleProcessAll = async () => {
    setInitializing(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process-all' })
      })
      
      if (response.ok) {
        await fetchTasks()
      }
    } catch (error) {
      console.error('Error processing tasks:', error)
    } finally {
      setInitializing(false)
    }
  }

  const handleInitializeTasks = async () => {
    setInitializing(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      })
      
      if (response.ok) {
        await fetchTasks()
      }
    } catch (error) {
      console.error('Error initializing tasks:', error)
    } finally {
      setInitializing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2; label: string }> = {
      SCHEDULED: { variant: 'default', icon: Clock, label: 'Agendada' },
      RUNNING: { variant: 'outline', icon: Loader2, label: 'Executando' },
      COMPLETED: { variant: 'default', icon: CheckCircle2, label: 'Concluída' },
      FAILED: { variant: 'destructive', icon: XCircle, label: 'Falhou' },
      CANCELLED: { variant: 'secondary', icon: XCircle, label: 'Cancelada' },
    }
    const config = variants[status] || variants.SCHEDULED
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${status === 'RUNNING' ? 'animate-spin' : ''}`} />
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
          <h1 className="text-3xl font-bold text-slate-900">Tarefas Agendadas</h1>
          <p className="text-slate-500 mt-1">Gerencie tarefas automáticas do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleInitializeTasks} disabled={initializing}>
            {initializing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Inicializar Padrão
          </Button>
          <Button onClick={handleProcessAll} disabled={initializing}>
            <Play className="h-4 w-4 mr-2" />
            Processar Agora
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-sm text-slate-500">Total de Tarefas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.filter(t => t.enabled).length}</p>
                <p className="text-sm text-slate-500">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <History className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.reduce((acc, t) => acc + t.runCount, 0)}</p>
                <p className="text-sm text-slate-500">Execuções</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.reduce((acc, t) => acc + t.failCount, 0)}</p>
                <p className="text-sm text-slate-500">Falhas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Tarefas Configuradas</CardTitle>
          <CardDescription>Gerencie as tarefas agendadas do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Nenhuma tarefa configurada</p>
              <p className="text-sm mt-1">Clique em "Inicializar Padrão" para criar as tarefas básicas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const typeInfo = TASK_TYPE_INFO[task.taskType] || { icon: Clock, color: 'text-slate-500', label: task.taskType }
                const Icon = typeInfo.icon
                
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 bg-slate-100 rounded-lg`}>
                        <Icon className={`h-6 w-6 ${typeInfo.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{task.name}</p>
                          {getStatusBadge(task.status)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                          <span>{getCronDescription(task.cronExpression)}</span>
                          <span>•</span>
                          <span>{task.runCount} execuções</span>
                          {task.lastDuration && (
                            <>
                              <span>•</span>
                              <span>Duração: {formatDuration(task.lastDuration)}</span>
                            </>
                          )}
                        </div>
                        {task.lastError && (
                          <p className="text-sm text-red-500 mt-1 truncate max-w-md">{task.lastError}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={task.enabled}
                          onCheckedChange={(checked) => handleToggleTask(task.id, checked)}
                        />
                        <Badge variant={task.enabled ? 'default' : 'secondary'}>
                          {task.enabled ? 'Ativa' : 'Pausada'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task)
                            setDetailsOpen(true)
                          }}
                        >
                          <History className="h-4 w-4 mr-2" />
                          Histórico
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleExecuteTask(task.id)}
                          disabled={!task.enabled || executingId === task.id}
                        >
                          {executingId === task.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Executar
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Execuções</DialogTitle>
            <DialogDescription>
              {selectedTask?.name} - Últimas execuções
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">Próxima execução</p>
                  <p className="font-medium">{formatDate(selectedTask.nextRunAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Última execução</p>
                  <p className="font-medium">{formatDate(selectedTask.lastRunAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total de execuções</p>
                  <p className="font-medium">{selectedTask.runCount}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Taxa de sucesso</p>
                  <p className="font-medium">
                    {selectedTask.runCount > 0 
                      ? Math.round((selectedTask.runCount - selectedTask.failCount) / selectedTask.runCount * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Últimas Execuções</h4>
                {selectedTask.executions.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhuma execução registrada</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {selectedTask.executions.map((exec) => (
                      <div key={exec.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          {exec.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{formatDate(exec.startedAt)}</p>
                            {exec.error && (
                              <p className="text-xs text-red-500">{exec.error}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">
                          {formatDuration(exec.duration)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
